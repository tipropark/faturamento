
const fs = require('fs');
const path = 'c:/VibeCoding/leve-erp/src/app/(dashboard)/admin/faturamento/metas/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Regex to catch the whole function start until handleCreateMeta
const functionHeaderRegex = /export default function MetasPage\(\) \{[\s\S]+?const handleCreateMeta = async \(e: React\.FormEvent\) => \{/;

const cleanHeader = `export default function MetasPage() {
  const [activeTab, setActiveTab] = useState<'mensal' | 'diaria' | 'alertas'>('mensal');
  const [periodo, setPeriodo] = useState({ 
    mes: new Date().getMonth() + 1, 
    ano: new Date().getFullYear() 
  });

  const queryStr = \`mes=\${periodo.mes}&ano=\${periodo.ano}&with_diarias=false\`;
  const { data: metasData, mutate: fetchMetas, isValidating: isMetasValidating } = useSWR(\`/api/metas-faturamento?\${queryStr}\`, fetcher);
  const { data: opsData } = useSWR("/api/operacoes", fetcher);
  const { data: sessionData } = useSWR('/api/auth/session', fetcher);

  const metas = metasData || [];
  const operacoes = opsData || [];
  const isRefreshing = isMetasValidating;
  const loading = !metasData;

  const [selectedAlerta, setSelectedAlerta] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<string>('');
  const [selectedMetaId, setSelectedMetaId] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState<string | null>(null);

  useEffect(() => {
    if (sessionData?.user?.perfil) setUserProfile(sessionData.user.perfil);
  }, [sessionData]);

  const fetchDados = () => { fetchMetas(); };

  const [showModal, setShowModal] = useState(false);
  const [newMeta, setNewMeta] = useState({
    operacao_id: '',
    tipo_meta: 'operacao' as TipoMeta,
    valor_meta: 0,
    ano: periodo.ano,
    mes: periodo.mes,
    observacoes: ''
  });

  // Atualiza default da nova meta quando muda o filtro
  useEffect(() => {
    setNewMeta(p => ({ ...p, ano: periodo.ano, mes: periodo.mes }));
  }, [periodo]);

  const handleCreateMeta = async (e: React.FormEvent) => {`;

content = content.replace(functionHeaderRegex, cleanHeader);

// Also remove any remaining duplicates that might have leaked below
// (though the regex above should have caught most of it)

fs.writeFileSync(path, content);
console.log('Success Agressive Clean');
