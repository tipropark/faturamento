import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient } from '@/lib/audit';
import { auth } from '@/lib/auth';
import { getDriveService } from '@/lib/drive';
import { Readable } from 'stream';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id: sinistroId } = await params;
  const userId = session.user.id as string;
  const supabase = await getAuditedClient(userId);

  const formData = await req.formData();
  const files = formData.getAll('files') as File[];
  const categoria = formData.get('categoria') as string;

  if (!files.length) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
  }

  // A. Validar tamanho máximo (500MB) e tipos por categoria
  const MAX_SIZE = 500 * 1024 * 1024; // 500MB
  const allowedTypes: Record<string, string[]> = {
    'imagens_ocorrencia': ['image/jpeg', 'image/png', 'image/webp'],
    'boletim_ocorrencia': ['application/pdf', 'image/jpeg', 'image/png'],
    'comprovantes_financeiros': ['application/pdf', 'image/jpeg', 'image/png'],
    'evidencias_adicionais': ['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png', 'application/pdf'],
    'imagens_cftv': ['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp'],
    'fotos_avaria': ['image/jpeg', 'image/png', 'image/webp'],
    'fotos_prevencao': ['image/jpeg', 'image/png', 'image/webp'],
    // Permitir uma gama maior por padrão nas outras categorias neste primeiro momento
  };

  for (const file of files) {
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `O arquivo ${file.name} excede o limite máximo de 500MB.` }, { status: 400 });
    }
    
    // Validar tipo baseado na categoria (se a categoria tiver regras especificas)
    if (allowedTypes[categoria]) {
      const isValid = allowedTypes[categoria].some(tipo => file.type.includes(tipo.split('/')[1]) || file.type === tipo);
      if (!isValid && file.type) { // file.type can be empty on some browsers, relax if empty to not block
        return NextResponse.json({ 
          error: `Tipo de arquivo não permitido para esta categoria: ${file.name}. Tipos aceitos: ${allowedTypes[categoria].map(t => t.split('/')[1].toUpperCase()).join(', ')}` 
        }, { status: 400 });
      }
    }
  }

  try {
    console.log(`📂 Iniciando processo de upload para Sinistro ID: ${sinistroId}`);
    const drive = await getDriveService();
    
    // Buscar o PR do sinistro para nomear a pasta
    const { data: sinistro, error: sinistroError } = await supabase
      .from('sinistros')
      .select('pr, cliente_nome')
      .eq('id', sinistroId)
      .single();

    if (sinistroError) {
      console.error('❌ Erro ao buscar dados do sinistro:', sinistroError);
      return NextResponse.json({ error: 'Erro ao buscar dados do sinistro' }, { status: 500 });
    }

    const folderName = sinistro ? `${sinistro.pr} - ${sinistro.cliente_nome}` : `Sinistro ${sinistroId}`;
    // Escapar aspas simples para a query do Drive
    const escapedFolderName = folderName.replace(/'/g, "\\'");
    const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || 'root';

    console.log(`📁 Buscando/Criando pasta: ${folderName}`);
    // 1. Verificar se a pasta já existe
    let targetFolderId = '';
    const listResponse = await drive.files.list({
      q: `name = '${escapedFolderName}' and mimeType = 'application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed = false`,
      fields: 'files(id)',
    });

    if (listResponse.data.files && listResponse.data.files.length > 0) {
      targetFolderId = listResponse.data.files[0].id!;
      console.log(`✅ Pasta existente encontrada ID: ${targetFolderId}`);
    } else {
      console.log(`✨ Criando nova pasta...`);
      // 2. Criar a pasta se não existir
      const createFolderResponse = await drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentFolderId],
        },
        fields: 'id',
      });
      targetFolderId = createFolderResponse.data.id!;
      console.log(`✅ Nova pasta criada ID: ${targetFolderId}`);
    }

    const uploaded: any[] = [];
    console.log(`🚀 Preparando upload de ${files.length} arquivos...`);

    for (const file of files) {
      console.log(`📤 Enviando: ${file.name} (${file.size} bytes)`);
      // Converter File para Stream para o Google Drive
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      const fileMetadata = {
        name: file.name, // Removido o timestamp do nome para ficar mais limpo na pasta
        parents: [targetFolderId],
      };

      const media = {
        mimeType: file.type,
        body: stream,
      };

      const driveResponse = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
      });
      
      console.log(`✅ Arquivo no Drive ID: ${driveResponse.data.id}`);

      const { data: anexo, error: insertError } = await supabase
        .from('anexos')
        .insert({
          sinistro_id: sinistroId,
          categoria,
          nome_arquivo: file.name,
          url: driveResponse.data.webViewLink,
          drive_file_id: driveResponse.data.id,
          tamanho: file.size,
          tipo_mime: file.type,
          usuario_id: userId,
        })
        .select(`*, usuario:usuarios!usuario_id(id, nome)`)
        .single();

      if (insertError) {
        console.error(`❌ Erro ao registrar anexo no banco:`, insertError);
      } else if (anexo) {
        uploaded.push(anexo);
      }
    }

    // Histórico
    if (uploaded.length > 0) {
      const detalhesArquivos = uploaded.map(u => 
        `- ${u.nome_arquivo} (${u.tipo_mime?.split('/')[1]?.toUpperCase() || 'Arquivo'}, ${(u.tamanho / 1024 / 1024).toFixed(2)} MB)`
      ).join('\n');
      
      await supabase.from('historico_sinistros').insert({
        sinistro_id: sinistroId,
        usuario_id: userId,
        acao: 'anexo',
        descricao: `Upload concluído: ${uploaded.length} arquivo(s) na categoria "${categoria}".\nSendo eles:\n${detalhesArquivos}`,
      });
    }

    if (uploaded.length === 0 && files.length > 0) {
      console.error('❌ Falha crítica: Nenhum arquivo foi registrado no banco após upload no Drive.');
      return NextResponse.json({ 
        error: 'Os arquivos foram enviados ao Drive mas não puderam ser registrados no sistema. Verifique a estrutura do banco de dados.',
        filesCount: files.length
      }, { status: 500 });
    }

    return NextResponse.json(uploaded, { status: 201 });
  } catch (error: any) {
    console.error('❌ Drive upload error total:', error);
    return NextResponse.json({ 
      error: 'Erro fatal no processo de upload para o Google Drive', 
      message: error.message,
      code: error.code || 'unknown'
    }, { status: 500 });
  }
}
