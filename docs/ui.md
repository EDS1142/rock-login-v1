## Guia de Interface e Interatividade (UI)

### 5.1. Identidade Visual (Design Tokens)
*Esta seção define as variáveis globais que garantem a consistência visual do app.*

#### 5.1.1. Paleta de Cores
| Categoria | Finalidade | Hexadecimal |
| :--- | :--- | :--- |
| **Primary** | Cor principal (Ações Fortes) | `#0084c2` |
| **Secondary** | Elementos de suporte | `#005a87` |
| **Background** | Fundo da aplicação | `#f0f2f5` (radial-gradient com cores brand) |
| **Surface** | Cards e Modais | `#ffffff` |
| **Text Primary** | Texto principal | `#1a1a1a` |
| **Text Secondary** | Texto de suporte | `#65676b` |

#### 5.1.2. Tipografia
* **Fonte Principal:** Inter (Google Fonts)
* **Escala de Texto:**
    * **H1:** 2.2rem | Bold (700)
    * **H2:** 2rem | Bold (700)
    * **Body:** 1rem | Regular (400)
    * **Caption:** 0.75rem | Bold (700) - Labels
    * **Small:** 12px - Copyright

---

### 5.2. Interatividade (Behavior & Feedback)
*Define como o sistema responde visualmente às ações do usuário.*

#### 5.2.1. Estados de Botões e Cliques
* **Hover (Mouse em cima):** Mudança de cor no botão primário para `#0070a5` e elevação `-2px` com um leve ajuste de Shadow (`0 4px 12px rgba(0, 132, 194, 0.3)`). Tempo de transição: `300ms cubic-bezier`.
* **Active (No clique):** Efeito de "pressionado" voltando a translação vertical a `0`.
* **Loading (Ação em curso):** O texto do botão e seu ícone dão lugar ao spinner de submissão (Loader css), desabilitando o botão e alterando o texto de forma sequencial ("Autenticando...", "Verificando acesso...", "Iniciando...").

#### 5.2.2. Navegação e Transições
* **Animações de Entrada:** O Card de login apresenta uma animação de `cardEnter` com um deslocamento de subida (transform: translateY) e aumento de escala de 0.98 a 1.0 (opacity de 0 a 1) por `800ms ease-out`.
* **Elemento Flutuante (Branding):** O Logo Rock Team flutua verticalmente (-10px de elevação a 0) num ciclo infinito de 6 segundos.

#### 5.2.3. Formulários Dinâmicos
* **Focus State:** Quando o input ganha foco, a borda torna-se cor primária (`#0084c2`) com fundo branco e uma leve sombra (box-shadow) azul.
* **Toggle Password:** Um ícone que altera o tipo do campo de senha (SVG interativo mudando cor no hover).

---

### 5.3. Componentes de Interface
#### 5.3.1. Botões
* **Primary (Submit):** Botão largo, de padding substancial, fundo primário sólido, fonte semibold e com transição em hover.

#### 5.3.2. Inputs
* **Label:** Sempre acima do campo (0.75rem e color secondary).
* **Estrutura com Ícones:** Uso de ícones embutidos nos inputs na lateral esquerda (`absolute` left `12px`), dando contexto visual de e-mail e cadeado para a senha.

---

### 5.4. Estados da Interface (UI States)
1.  **Loading State:** Feedback claro ocorrendo dentro do próprio botão de submit.
2.  **Error Toasts:** Em caso de erro o catch exibe alert nativo, ou log no console dependendo da operação. Erros que impedem acesso interrompem o progresso restabelecendo o form initial state.

---

### 5.5. Layout e Responsividade
* **Mobile/Tablet:** (Até `850px` min-width breakpoint)
  * O `login-card` flex direction se transforma em `column`.
  * Padding e margens do branding reduzem drasticamente e perde a flexibilidade `flex: 1` e afins para `flex: none`.
  * `logo-container` diminui de 100px para 80px.
  * O tamanho da fonte no título cai para 1.8rem.
