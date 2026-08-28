import { LegalPageLayout } from '@/components/legal/LegalPageLayout'

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout title="Política de Privacidade" lastUpdated="28 de agosto de 2026">
      <section>
        <h2>1. Quem somos</h2>
        <p>
          O Ametista Conversões é uma plataforma de gestão para agências de marketing de performance, operada pela
          Ametista Conversões ("nós", "nossa agência"). Esta política explica quais dados o app coleta, para que os
          usamos, com quem compartilhamos e quais direitos você tem sobre eles, em conformidade com a Lei Geral de
          Proteção de Dados (LGPD — Lei nº 13.709/2018).
        </p>
      </section>

      <section>
        <h2>2. Quais dados coletamos</h2>
        <p>Dependendo de como você usa o app, coletamos:</p>
        <ul>
          <li>
            <strong>Dados da sua conta</strong>: nome, e-mail, telefone e papel de acesso (administrador, gestor ou
            cliente).
          </li>
          <li>
            <strong>Dados cadastrados sobre clientes da agência</strong>: nome, empresa, e-mail, telefone, plano,
            mensalidade, notas internas, e premissas de negócio usadas para calcular receita estimada (ex: leads
            necessários para 1 venda, ticket médio).
          </li>
          <li>
            <strong>Métricas de campanhas de anúncio</strong>: investimento, cliques, impressões e conversões,
            sincronizados automaticamente das contas de Google Ads e Meta Ads que você conectar — sempre dados
            agregados da campanha, nunca dados pessoais de quem viu ou clicou no anúncio.
          </li>
          <li>
            <strong>Respostas de Google Forms</strong>: quando um formulário de captação de leads é conectado,
            sincronizamos as perguntas e respostas desse formulário — que podem incluir dados pessoais de quem
            respondeu (nome, e-mail, telefone, respostas abertas). Esse dado pertence ao cliente da agência que
            criou o formulário; processamos em nome dele.
          </li>
          <li>
            <strong>Conversas com a Cassie (assistente de IA)</strong> e com a ferramenta de Comunicação Persuasiva —
            o conteúdo das mensagens trocadas, incluindo, quando relevante, trechos de respostas de formulário usados
            como contexto.
          </li>
          <li>
            <strong>Arquivos e comentários</strong> enviados pelo Portal do Cliente ou pelo Portal do Gestor,
            incluindo mensagens de áudio.
          </li>
          <li>
            <strong>Inscrição de notificação push</strong>: um identificador técnico do seu navegador/aparelho,
            usado só para entregar notificações — não conseguimos ler nada além disso a partir dele.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Para que usamos esses dados</h2>
        <ul>
          <li>Operar o app: mostrar dashboards, tarefas, projetos, relatórios e permitir a comunicação entre agência e cliente.</li>
          <li>Sincronizar métricas reais de campanhas para os relatórios de desempenho.</li>
          <li>Gerar respostas da Cassie e sugestões de comunicação persuasiva, usando IA.</li>
          <li>Enviar notificações relevantes (reuniões, tarefas, alertas, incidentes).</li>
          <li>Manter um registro de auditoria de ações importantes, por segurança.</li>
        </ul>
      </section>

      <section>
        <h2>4. Com quem compartilhamos</h2>
        <p>Não vendemos dados. Compartilhamos só com prestadores de serviço que operam o app, cada um recebendo só o necessário para sua função:</p>
        <ul>
          <li><strong>Supabase</strong> — hospeda o banco de dados, autenticação, arquivos enviados e a lógica do servidor.</li>
          <li><strong>OpenAI</strong> — recebe o conteúdo das mensagens trocadas com a Cassie e com a Comunicação Persuasiva, para gerar as respostas.</li>
          <li><strong>Google</strong> — quando você conecta uma conta (login, Google Ads, Google Forms), trocamos dados de autenticação e sincronizamos métricas/respostas com a API do Google.</li>
          <li><strong>Meta</strong> — mesma lógica, para contas de Meta Ads conectadas.</li>
          <li><strong>Vercel</strong> — hospeda o site do app.</li>
          <li>Provedores de notificação push do seu navegador (ex: Google/Mozilla) — só entregam a notificação, não conseguem ler o conteúdo.</li>
        </ul>
      </section>

      <section>
        <h2>5. Como protegemos os dados</h2>
        <ul>
          <li>Cada cliente da agência só enxerga os próprios dados — reforçado por regras de acesso no banco de dados (Row Level Security), não só na tela.</li>
          <li>Tokens de acesso às contas de Google/Meta Ads ficam criptografados, nunca em texto puro.</li>
          <li>Toda comunicação entre seu navegador e o app é feita por HTTPS.</li>
        </ul>
      </section>

      <section>
        <h2>6. Por quanto tempo guardamos</h2>
        <p>
          Mantemos os dados enquanto sua conta ou a relação com a agência estiver ativa. Ao encerrar uma conta ou
          contrato, os dados podem ser apagados mediante solicitação, respeitando prazos legais de guarda quando
          aplicável (ex: registros fiscais).
        </p>
      </section>

      <section>
        <h2>7. Seus direitos (LGPD)</h2>
        <p>Você pode, a qualquer momento, solicitar:</p>
        <ul>
          <li>Confirmação de quais dados seus temos e acesso a eles.</li>
          <li>Correção de dados incompletos, desatualizados ou incorretos.</li>
          <li>Exclusão dos seus dados, quando não houver base legal para mantê-los.</li>
          <li>Portabilidade dos dados a outro fornecedor.</li>
          <li>Revogação de consentimento, quando o tratamento depender dele.</li>
        </ul>
        <p>Pedidos podem ser feitos pelo e-mail no final desta página.</p>
      </section>

      <section>
        <h2>8. Cookies</h2>
        <p>
          Usamos apenas o armazenamento local necessário para manter você conectado (sessão de login). Não usamos
          cookies de rastreamento ou de publicidade de terceiros.
        </p>
      </section>

      <section>
        <h2>9. Menores de idade</h2>
        <p>O app é uma ferramenta de uso profissional/empresarial, não é direcionado a menores de 18 anos.</p>
      </section>

      <section>
        <h2>10. Alterações nesta política</h2>
        <p>Podemos atualizar esta página conforme o app evolui. A data no topo sempre indica a versão mais recente.</p>
      </section>

      <section>
        <h2>11. Contato</h2>
        <p>Dúvidas ou pedidos sobre seus dados: ametistaconversoes@gmail.com</p>
      </section>
    </LegalPageLayout>
  )
}
