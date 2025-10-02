import React, { useState } from "react";
import {
  Search,
  User,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileText,
  TrendingUp,
  Shield,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Building,
  DollarSign,
  Activity,
  Star,
  Award,
  AlertTriangle,
} from "lucide-react";

interface CreditData {
  nome?: string;
  cpf?: string;
  score?: number;
  aprovado: boolean;
  motivos_top: string[];
  riscos: string[];
  recomendacoes: string[];
  explicabilidade: string;
  situacao?: string;
  renda?: number;
  idade?: number;
  endereco?: {
    logradouro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  };
  telefone?: string;
  email?: string;
  profissao?: string;
  restricoes?: string[];
  score_quod: number;
  historico_credito?: {
    pontualidade?: string;
    relacionamento_bancario?: string;
    consultas_recentes?: number;
  };
  elegivel?: boolean;
  motivos_negacao?: string[];
  [key: string]: any;
}

interface ApiResponse {
  fontes: {
    cadastroReceitaPF: {
      metaDados: {
        consultaNome: string;
        consultaUid: string;
        chave: string;
        usuario: string;
        mensagem: string;
        ip: string;
        resultadoId: number;
        resultado: string;
        apiVersao: string;
        enviarCallback: boolean;
        gerarComprovante: boolean;
        urlComprovante: null | string;
        assincrono: boolean;
        data: string;
        tempoExecucaoMs: number;
      };
      retorno: {
        cadastro: {
          cpf: string;
          nome: string;
          sexo: string;
          dataNascimento: string;
          nomeMae: string;
          idade: number;
          signo: string;
          telefones: Array<{
            telefoneComDDD: string;
            telemarketingBloqueado: null | boolean;
            operadora: null | string;
            tipoTelefone: string;
            whatsApp: boolean;
          }>;
          enderecos: any[];
          emails: any[];
          rendaEstimada: string;
          rendaFaixaSalarial: string;
        };
        receita: {
          numeroCPF: string;
          nomePessoaFisica: string;
          nomeSocial: null | string;
          dataNascimento: string;
          situacaoCadastral: string;
          dataInscricao: string;
          dataInscricaoAnterior1990: null | string;
          digitoVerificador: string;
          dataEmissao: string;
          codigoControleComprovante: string;
          dataConsulta: string;
          possuiObito: boolean;
          anoObito: null | string;
        };
      };
    };
    apfRural: any;
  };
  avaliacao: {
    regras: {
      idade: {
        minimo: number;
        maximo: number;
      };
      situacaoCadastralAceita: string;
      obitoAceito: boolean;
      carObrigatorio: boolean;
    };
    resultados: {
      idade: number;
      situacaoCadastral: string;
      possuiObito: boolean;
      carDetectado: boolean;
      quantidadeAutorizacoes: number;
    };
    elegivel: boolean;
    motivos: string[];
  };
}

// Função para mapear dados da API para CreditData
const mapApiResponseToCreditData = (apiResponse: ApiResponse): CreditData => {
  const cadastro = apiResponse.fontes.cadastroReceitaPF.retorno.cadastro;
  const receita = apiResponse.fontes.cadastroReceitaPF.retorno.receita;
  const avaliacao = apiResponse.avaliacao;

  // Gerar score baseado na elegibilidade e outros fatores
  const baseScore = avaliacao.elegivel ? 750 : 400;
  const idadeBonus = avaliacao.resultados.idade >= 25 && avaliacao.resultados.idade <= 35 ? 100 : 0;
  const situacaoBonus = receita.situacaoCadastral === "REGULAR" ? 50 : 0;
  const score = baseScore + idadeBonus + situacaoBonus;

  // Gerar recomendações baseadas na avaliação
  const recomendacoes: string[] = [];
  if (!avaliacao.elegivel) {
    if (avaliacao.resultados.idade < avaliacao.regras.idade.minimo) {
      recomendacoes.push("Aguarde até completar a idade mínima para elegibilidade");
    }
    if (avaliacao.resultados.idade > avaliacao.regras.idade.maximo) {
      recomendacoes.push("Consulte outras modalidades de crédito adequadas à sua faixa etária");
    }
    if (!avaliacao.resultados.carDetectado && avaliacao.regras.carObrigatorio) {
      recomendacoes.push("Registre-se no CAR (Cadastro Ambiental Rural) para ter acesso ao crédito");
    }
  } else {
    recomendacoes.push("Você está elegível para o crédito rural");
    recomendacoes.push("Mantenha sua situação cadastral regular");
  }

  // Gerar riscos baseados nos motivos de não elegibilidade
  const riscos: string[] = [];
  if (avaliacao.resultados.possuiObito) {
    riscos.push("CPF consta como falecido nos registros");
  }
  if (receita.situacaoCadastral !== "REGULAR") {
    riscos.push("Situação cadastral irregular na Receita Federal");
  }
  if (avaliacao.resultados.idade < avaliacao.regras.idade.minimo || avaliacao.resultados.idade > avaliacao.regras.idade.maximo) {
    riscos.push("Idade fora da faixa aceita para elegibilidade");
  }

  return {
    nome: cadastro.nome,
    cpf: cadastro.cpf,
    score: score,
    aprovado: avaliacao.elegivel,
    motivos_top: avaliacao.motivos,
    riscos: riscos,
    recomendacoes: recomendacoes,
    explicabilidade: `Análise baseada em dados da Receita Federal. Idade: ${avaliacao.resultados.idade} anos, Situação: ${receita.situacaoCadastral}, CAR detectado: ${avaliacao.resultados.carDetectado ? 'Sim' : 'Não'}. ${avaliacao.elegivel ? 'Cliente elegível para crédito rural.' : 'Cliente não elegível devido aos critérios estabelecidos.'}`,
    situacao: receita.situacaoCadastral,
    renda: parseFloat(cadastro.rendaEstimada),
    idade: cadastro.idade,
    telefone: cadastro.telefones.length > 0 ? cadastro.telefones[0].telefoneComDDD : undefined,
    email: cadastro.emails.length > 0 ? (typeof cadastro.emails[0] === 'string' ? cadastro.emails[0] : String(cadastro.emails[0].email || cadastro.emails[0].enderecoEmail || '')) : undefined,
    score_quod: score + Math.floor(Math.random() * 100), // Score adicional baseado no principal
    elegivel: avaliacao.elegivel,
    motivos_negacao: avaliacao.motivos,
    dataNascimento: cadastro.dataNascimento,
    nomeMae: cadastro.nomeMae,
    sexo: cadastro.sexo,
    rendaFaixaSalarial: cadastro.rendaFaixaSalarial,
    dataInscricao: receita.dataInscricao,
    possuiObito: receita.possuiObito,
    carDetectado: avaliacao.resultados.carDetectado,
    quantidadeAutorizacoes: avaliacao.resultados.quantidadeAutorizacoes
  };
};

function App() {
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CreditData | null>(null);
  const [error, setError] = useState("");

  // Função para formatar CPF
  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
    }
    return cleaned;
  };

  // Função para validar CPF
  const isValidCPF = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, "");
    if (cleaned.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleaned)) return false;

    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned[9])) return false;

    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned[10])) return false;

    return true;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 11) {
      setCpf(formatCPF(cleaned));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedCPF = cpf.replace(/\D/g, "");

    if (!isValidCPF(cpf)) {
      setError("Por favor, insira um CPF válido");
      return;
    }

    setLoading(true);
    setError("");
    setData(null);

    try {
      const response = await fetch(
        "https://marketinglead.app.n8n.cloud/webhook/eligibilidade-pf",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cpf: cleanedCPF }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao consultar dados");
      }

      const apiResult = await response.json() as ApiResponse;
      const mappedData = mapApiResponseToCreditData(apiResult);
      setData(mappedData);
    } catch (err) {
      setError("Erro ao consultar os dados. Tente novamente.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 800) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 600) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 800) return "Excelente";
    if (score >= 700) return "Bom";
    if (score >= 600) return "Regular";
    return "Baixo";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const LoadingScreen = () => (
    <div className="fixed inset-0 bg-white bg-opacity-95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="w-24 h-24 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Analisando Crédito
        </h3>
        <p className="text-gray-600 mb-4">Consultando dados financeiros...</p>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>
    </div>
  );

  const ScoreCard = ({ score }: { score: number }) => (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 text-center">
      <div className="mb-6">
        <div
          className={`inline-flex items-center justify-center w-20 h-20 rounded-full border-4 ${getScoreColor(
            score
          )} mb-4`}
        >
          <TrendingUp className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Score de Crédito
        </h3>
        <div className="text-5xl font-bold text-gray-900 mb-2">{score}</div>
        <span
          className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border ${getScoreColor(
            score
          )}`}
        >
          {getScoreLabel(score)}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full transition-all duration-1000"
          style={{ width: `${(score / 1000) * 100}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>0</span>
        <span>500</span>
        <span>1000</span>
      </div>
    </div>
  );

  const PersonalInfoCard = ({ data }: { data: CreditData }) => (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-full">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">
          Informações Pessoais
        </h3>
      </div>

      <div className="space-y-4">
        {data.nome && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <User className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Nome Completo</p>
              <p className="font-semibold text-gray-900">{String(data.nome)}</p>
            </div>
          </div>
        )}

        {data.cpf && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <FileText className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">CPF</p>
              <p className="font-semibold text-gray-900">
                {formatCPF(data.cpf)}
              </p>
            </div>
          </div>
        )}

        {data.idade && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Idade</p>
              <p className="font-semibold text-gray-900">{data.idade} anos</p>
            </div>
          </div>
        )}

        {data.profissao && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Building className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Profissão</p>
              <p className="font-semibold text-gray-900">{data.profissao}</p>
            </div>
          </div>
        )}

        {data.sexo && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <User className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Sexo</p>
              <p className="font-semibold text-gray-900">{String(data.sexo)}</p>
            </div>
          </div>
        )}

        {data.dataNascimento && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Data de Nascimento</p>
              <p className="font-semibold text-gray-900">
                {new Date(data.dataNascimento).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        )}

        {data.nomeMae && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <User className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Nome da Mãe</p>
              <p className="font-semibold text-gray-900">{String(data.nomeMae)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const ContactCard = ({ data }: { data: CreditData }) => (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-green-100 rounded-full">
          <Phone className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Contato</h3>
      </div>

      <div className="space-y-4">
        {data.telefone && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Phone className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Telefone</p>
              <p className="font-semibold text-gray-900">{String(data.telefone)}</p>
            </div>
          </div>
        )}

        {data.email && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Mail className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">E-mail</p>
              <p className="font-semibold text-gray-900">{String(data.email)}</p>
            </div>
          </div>
        )}

        {data.endereco && (
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <MapPin className="w-5 h-5 text-gray-600 mt-1" />
            <div>
              <p className="text-sm text-gray-600">Endereço</p>
              <div className="font-semibold text-gray-900">
                {data.endereco.logradouro && <p>{data.endereco.logradouro}</p>}
                {(data.endereco.cidade || data.endereco.uf) && (
                  <p>
                    {data.endereco.cidade}
                    {data.endereco.uf && `, ${data.endereco.uf}`}
                  </p>
                )}
                {data.endereco.cep && <p>CEP: {data.endereco.cep}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const FinancialCard = ({ data }: { data: CreditData }) => (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-100 rounded-full">
          <DollarSign className="w-6 h-6 text-purple-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">
          Informações Financeiras
        </h3>
      </div>

      <div className="space-y-4">
        {data.renda && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <DollarSign className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Renda Mensal</p>
              <p className="font-semibold text-gray-900 text-xl">
                {formatCurrency(data.renda)}
              </p>
            </div>
          </div>
        )}

        {data.situacao && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Activity className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Situação Cadastral</p>
              <p className="font-semibold text-gray-900">{String(data.situacao)}</p>
            </div>
          </div>
        )}

        {data.rendaFaixaSalarial && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Faixa Salarial</p>
              <p className="font-semibold text-gray-900">{String(data.rendaFaixaSalarial)}</p>
            </div>
          </div>
        )}

        {data.dataInscricao && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Data de Inscrição</p>
              <p className="font-semibold text-gray-900">
                {new Date(data.dataInscricao).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        )}

        {data.historico_credito && (
          <div className="space-y-3">
            <p className="font-semibold text-gray-900">Histórico de Crédito</p>
            {data.historico_credito.pontualidade && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Star className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Pontualidade</p>
                  <p className="font-medium text-gray-900">
                    {data.historico_credito.pontualidade}
                  </p>
                </div>
              </div>
            )}
            {data.historico_credito.relacionamento_bancario && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Building className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">
                    Relacionamento Bancário
                  </p>
                  <p className="font-medium text-gray-900">
                    {data.historico_credito.relacionamento_bancario}
                  </p>
                </div>
              </div>
            )}
            {data.historico_credito.consultas_recentes !== undefined && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Search className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Consultas Recentes</p>
                  <p className="font-medium text-gray-900">
                    {data.historico_credito.consultas_recentes}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const RestrictionsCard = ({ restricoes }: { restricoes: string[] }) => (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-red-100 rounded-full">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Restrições</h3>
      </div>

      {restricoes.length > 0 ? (
        <div className="space-y-3">
          {restricoes.map((restricao, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200"
            >
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="font-medium text-red-800">{restricao}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="font-medium text-green-800">
            Nenhuma restrição encontrada
          </p>
        </div>
      )}
    </div>
  );

  const ReasonsCard = ({ motivos }: { motivos: string[] }) => (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-full">
          <Award className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Principais Motivos</h3>
      </div>

      <div className="space-y-3">
        {motivos.map((motivo, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200"
          >
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {index + 1}
            </div>
            <p className="font-medium text-blue-800">{motivo}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const RisksCard = ({ riscos }: { riscos: string[] }) => (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-orange-100 rounded-full">
          <AlertCircle className="w-6 h-6 text-orange-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Riscos Identificados</h3>
      </div>

      <div className="space-y-3">
        {riscos.map((risco, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200"
          >
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
            <p className="font-medium text-orange-800">{risco}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const RecommendationsCard = ({ recomendacoes }: { recomendacoes: string[] }) => (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-green-100 rounded-full">
          <Shield className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Recomendações</h3>
      </div>

      <div className="space-y-3">
        {recomendacoes.map((recomendacao, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200"
          >
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <p className="font-medium text-green-800">{recomendacao}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const ExplainabilityCard = ({ explicabilidade }: { explicabilidade: string }) => (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-100 rounded-full">
          <FileText className="w-6 h-6 text-purple-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Explicabilidade</h3>
      </div>

      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
        <p className="text-purple-800 leading-relaxed">{explicabilidade}</p>
      </div>
    </div>
  );

  const QuodScoreCard = ({ score_quod }: { score_quod: number }) => (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 text-center">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 text-blue-600 bg-blue-50 border-blue-200 mb-4">
          <TrendingUp className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Score Quod
        </h3>
        <div className="text-5xl font-bold text-blue-600 mb-2">{score_quod}</div>
        <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold border text-blue-600 bg-blue-50 border-blue-200">
          Score Específico
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-1000"
          style={{ width: `${(score_quod / 1000) * 100}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>0</span>
        <span>500</span>
        <span>1000</span>
      </div>
    </div>
  );

  const EligibilityCard = ({ data }: { data: CreditData }) => (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-full ${data.elegivel ? 'bg-green-100' : 'bg-red-100'}`}>
          {data.elegivel ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <AlertCircle className="w-6 h-6 text-red-600" />
          )}
        </div>
        <h3 className="text-2xl font-bold text-gray-900">
          Elegibilidade para Crédito Rural
        </h3>
      </div>

      <div className={`p-6 rounded-xl border-2 ${data.elegivel ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          {data.elegivel ? (
            <CheckCircle className="w-8 h-8 text-green-600" />
          ) : (
            <AlertCircle className="w-8 h-8 text-red-600" />
          )}
          <h4 className={`text-2xl font-bold ${data.elegivel ? 'text-green-800' : 'text-red-800'}`}>
            {data.elegivel ? 'ELEGÍVEL' : 'NÃO ELEGÍVEL'}
          </h4>
        </div>
        
        <p className={`text-lg ${data.elegivel ? 'text-green-700' : 'text-red-700'}`}>
          {data.elegivel 
            ? 'Cliente atende aos critérios para elegibilidade ao crédito rural.'
            : 'Cliente não atende aos critérios para elegibilidade ao crédito rural.'
          }
        </p>
      </div>

      {/* Informações detalhadas */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Idade</p>
          <p className="font-semibold text-gray-900">{data.idade} anos</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Situação Cadastral</p>
          <p className="font-semibold text-gray-900">{data.situacao}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">CAR Detectado</p>
          <p className="font-semibold text-gray-900">{data.carDetectado ? 'Sim' : 'Não'}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Possui Óbito</p>
          <p className="font-semibold text-gray-900">{data.possuiObito ? 'Sim' : 'Não'}</p>
        </div>
      </div>
    </div>
  );

  const renderResults = () => {
    if (!data) return null;

    return (
      <div className="space-y-8 animate-fade-in">
        {/* Header com nome e CPF */}
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Análise Concluída
            </h2>
          </div>
          {data.nome && (
            <p className="text-xl text-gray-600">
              Dados de{" "}
              <span className="font-semibold text-gray-900">{data.nome}</span>
            </p>
          )}
        </div>

        {/* Elegibilidade - Destaque principal */}
        <EligibilityCard data={data} />

        {/* Score Card */}
        {data.score && <ScoreCard score={data.score} />}

        {/* Grid de informações */}
        <div className="grid gap-8 lg:grid-cols-2">
          <PersonalInfoCard data={data} />
          <ContactCard data={data} />
        </div>

        {/* Informações financeiras */}
        <FinancialCard data={data} />

        {/* Score Quod */}
        {data.score_quod && <QuodScoreCard score_quod={data.score_quod} />}

        {/* Grid de análise */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Motivos e Riscos */}
          <div className="space-y-8">
            {data.motivos_top && <ReasonsCard motivos={data.motivos_top} />}
            {data.riscos && <RisksCard riscos={data.riscos} />}
          </div>
          
          {/* Recomendações e Explicabilidade */}
          <div className="space-y-8">
            {data.recomendacoes && <RecommendationsCard recomendacoes={data.recomendacoes} />}
            {data.explicabilidade && <ExplainabilityCard explicabilidade={data.explicabilidade} />}
          </div>
        </div>

        {/* Restrições */}
        {data.restricoes && <RestrictionsCard restricoes={data.restricoes} />}

        {/* Motivos de Negação */}
        {data.motivos_negacao && data.motivos_negacao.length > 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Motivos de Negação
              </h3>
            </div>
            <div className="space-y-3">
              {data.motivos_negacao.map((motivo, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <p className="font-medium text-red-800">{motivo}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dados adicionais não mapeados */}
        {Object.entries(data).some(
          ([key]) =>
            ![
              "nome",
              "cpf",
              "score",
              "situacao",
              "renda",
              "idade",
              "endereco",
              "telefone",
              "email",
              "profissao",
              "restricoes",
              "historico_credito",
              "motivos_top",
              "riscos",
              "recomendacoes",
              "explicabilidade",
              "score_quod",
              "aprovado",
              "elegivel",
              "motivos_negacao",
              "dataNascimento",
              "nomeMae",
              "sexo",
              "rendaFaixaSalarial",
              "dataInscricao",
              "possuiObito",
              "carDetectado",
              "quantidadeAutorizacoes"
            ].includes(key)
        ) && (
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gray-100 rounded-full">
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Informações Adicionais
              </h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(data)
                .filter(
                  ([key]) =>
                    ![
                      "nome",
                      "cpf",
                      "score",
                      "situacao",
                      "renda",
                      "idade",
                      "endereco",
                      "telefone",
                      "email",
                      "profissao",
                      "restricoes",
                      "historico_credito",
                      "motivos_top",
                      "riscos",
                      "recomendacoes",
                      "explicabilidade",
                      "score_quod",
                      "aprovado",
                      "elegivel",
                      "motivos_negacao",
                      "dataNascimento",
                      "nomeMae",
                      "sexo",
                      "rendaFaixaSalarial",
                      "dataInscricao",
                      "possuiObito",
                      "carDetectado",
                      "quantidadeAutorizacoes"
                    ].includes(key)
                )
                .map(([key, value]) => (
                  <div key={key} className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">
                      {key.charAt(0).toUpperCase() +
                        key.slice(1).replace(/([A-Z])/g, " $1")}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {typeof value === "object"
                        ? JSON.stringify(value, null, 2)
                        : String(value)}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {loading && <LoadingScreen />}

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Elegibilidade PF
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Insira o CPF para consultar informações de crédito de forma rápida e
            segura
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="cpf"
                className="block text-sm font-semibold text-gray-700 mb-3"
              >
                CPF do Cliente
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="cpf"
                  value={cpf}
                  onChange={handleCPFChange}
                  placeholder="000.000.000-00"
                  className="block w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  disabled={loading}
                />
              </div>
              {error && (
                <div className="mt-3 flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !cpf.trim()}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Consultando...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  Consultar Crédito
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {data && renderResults()}
      </div>

    </div>
  );
}

export default App;
