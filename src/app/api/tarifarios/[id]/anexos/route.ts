import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { getDriveService } from '@/lib/drive';
import { Readable } from 'stream';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id: solicitacaoId } = await params;
  const userId = session.user.id as string;
  const supabase = await createAdminClient();

  const formData = await req.formData();
  const files = formData.getAll('files') as File[];

  if (!files.length) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
  }

  const MAX_SIZE = 500 * 1024 * 1024; // 500MB
  for (const file of files) {
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `O arquivo ${file.name} excede o limite de 500MB.` }, { status: 400 });
    }
  }

  try {
    const drive = await getDriveService();
    
    // Buscar dados da solicitação para pasta
    const { data: solicitacao, error: solError } = await supabase
      .from('solicitacoes_tarifario')
      .select('id, criado_em, operacao:operacoes(nome_operacao)')
      .eq('id', solicitacaoId)
      .single();

    if (solError) return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 500 });

    const folderName = `Tarifário - ${solicitacaoId.substring(0, 8)} - ${(solicitacao.operacao as any)?.nome_operacao}`;
    const escapedFolderName = folderName.replace(/'/g, "\\'");
    const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || 'root';

    // 1. Verificar/Criar pasta
    let targetFolderId = '';
    const listResponse = await drive.files.list({
      q: `name = '${escapedFolderName}' and mimeType = 'application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed = false`,
      fields: 'files(id)',
    });

    if (listResponse.data.files && listResponse.data.files.length > 0) {
      targetFolderId = listResponse.data.files[0].id!;
    } else {
      const createFolderResponse = await drive.files.create({
        requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [parentFolderId] },
        fields: 'id',
      });
      targetFolderId = createFolderResponse.data.id!;
    }

    const uploaded = [];
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      const driveResponse = await drive.files.create({
        requestBody: { name: file.name, parents: [targetFolderId] },
        media: { mimeType: file.type, body: stream },
        fields: 'id, webViewLink',
      });
      
      const { data: anexo, error: insertError } = await supabase
        .from('tarifarios_anexos')
        .insert({
          solicitacao_id: solicitacaoId,
          nome_arquivo: file.name,
          url: driveResponse.data.webViewLink,
          drive_file_id: driveResponse.data.id,
          tamanho: file.size,
          tipo_mime: file.type,
          usuario_id: userId,
        })
        .select(`*, usuario:usuarios!usuario_id(id, nome)`)
        .single();

      if (!insertError && anexo) uploaded.push(anexo);
    }

    // Histórico
    if (uploaded.length > 0) {
      await supabase.from('tarifarios_historico').insert({
        solicitacao_id: solicitacaoId,
        usuario_id: userId,
        acao: 'anexo',
        descricao: `Upload de ${uploaded.length} anexo(s) realizado.`,
      });
    }

    return NextResponse.json(uploaded, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id: solicitacaoId } = await params;
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('tarifarios_anexos')
    .select(`*, usuario:usuarios!usuario_id(id, nome)`)
    .eq('solicitacao_id', solicitacaoId)
    .order('criado_em', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
