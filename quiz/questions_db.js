// Banco de dados de perguntas do Quiz Sabor da Terra
const questionsDatabase = {
    // Configurações do quiz
    config: {
        questionsPerQuiz: 10, // Número de perguntas por quiz
        minCorrectForReward: 8, // Mínimo de acertos para ganhar recompensa (80%)
        difficulties: {
            facil: { time: 30, points: 10 },
            medio: { time: 20, points: 20 },
            dificil: { time: 15, points: 30 }
        }
    },
    
    // Categorias de perguntas
    categories: {
        brand: "Marca e Posicionamento",
        product: "Produto e Ingredientes",
        local: "Bitupitá e Cultura Local",
        acai: "Conhecimento Geral sobre Açaí",
        fun: "Perguntas Divertidas",
        ingredientes: "Ingredientes",
        caracteristicas: "Características",
        cultura: "Cultura",
        nutricao: "Nutrição",
        preparo: "Preparo",
        conservacao: "Conservação",
        producao: "Produção"
    },
    
    // Banco de perguntas
    questions: [
        // Categoria: Marca e Posicionamento
        {
            category: "brand",
            difficulty: "facil",
            question: "Qual o nome da nossa empresa?",
            options: [
                "Açaí da Terra",
                "Sabor da Terra",
                "Terra do Açaí",
                "Açaí Sabor"
            ],
            correctIndex: 1
        },
        {
            category: "brand",
            question: "Qual é o slogan oficial que define a nossa proposta?",
            options: [
                "O açaí mais barato da cidade",
                "Mais que açaí, uma experiência",
                "Açaí rápido como o vento",
                "Self-service de felicidade"
            ],
            correctIndex: 1,
            difficulty: "facil"
        },
        {
            category: "brand",
            question: "Como o Açaí Sabor da Terra se posiciona no mercado de Bitupitá?",
            options: [
                "Como uma opção de buffet livre (self-service)",
                "Como uma marca premium, focada em qualidade e atendimento",
                "Como a opção mais econômica da orla",
                "Como uma lanchonete com vários tipos de salgados"
            ],
            correctIndex: 1,
            difficulty: "facil"
        },
        {
            category: "brand",
            question: "Qual a principal diferença do nosso serviço em comparação aos concorrentes?",
            options: [
                "Não temos diferença, vendemos a mesma coisa",
                "Nosso foco é em produto premium e pedidos à la carte",
                "Só abrimos pela manhã",
                "Vendemos apenas açaí com peixe"
            ],
            correctIndex: 1,
            difficulty: "facil"
        },
        
        // Categoria: Produto e Ingredientes
        {
            category: "product",
            difficulty: "medio",
            question: "Qual é o nosso carro-chefe?",
            options: [
                "Açaí na Tigela",
                "Milk Shake de Açaí",
                "Açaí com Granola",
                "Smoothie de Açaí"
            ],
            correctIndex: 0
        },
        {
            category: "product",
            question: "Qual é o tipo de polpa de açaí que utilizamos em nossos produtos?",
            options: [
                "Polpa comum congelada",
                "Polpa Especial com maior concentração de fruta",
                "Polpa líquida diluída",
                "Polpa em pó reconstituída"
            ],
            correctIndex: 1,
            difficulty: "medio"
        },
        {
            category: "product",
            question: "Qual é o diferencial do nosso açaí mais elogiado pelos clientes?",
            options: [
                "O preço baixo",
                "A cremosidade e sabor intenso",
                "A rapidez no preparo",
                "O tamanho da porção"
            ],
            correctIndex: 1,
            difficulty: "medio"
        },
        
        // Categoria: Bitupitá e Cultura Local
        {
            category: "local",
            difficulty: "facil",
            question: "Qual esporte é famoso em Bitupitá devido aos ventos fortes?",
            options: [
                "Surf tradicional",
                "Kitesurf",
                "Futebol de areia",
                "Vôlei de praia"
            ],
            correctIndex: 1
        },
        {
            category: "local",
            difficulty: "facil",
            question: "Qual é o melhor horário para apreciar a paisagem de Bitupitá?",
            options: [
                "Durante a chuva",
                "No pôr do sol",
                "Às 3 da manhã",
                "Meio-dia"
            ],
            correctIndex: 1
        },
        
        // Categoria: Conhecimento Geral sobre Açaí
        {
            category: "acai",
            difficulty: "facil",
            question: "De qual região do Brasil o açaí é nativo?",
            options: [
                "Sul",
                "Norte (Amazônia)",
                "Nordeste",
                "Sudeste"
            ],
            correctIndex: 1
        },
        {
            category: "acai",
            difficulty: "facil",
            question: "Qual o benefício mais conhecido do açaí?",
            options: [
                "Ajuda a dormir melhor",
                "Rico em antioxidantes",
                "Cura gripe",
                "Diminui o apetite"
            ],
            correctIndex: 1
        },
        
        // Categoria: Perguntas Divertidas
        {
            category: "fun",
            difficulty: "facil",
            question: "Qual seria a melhor legenda para uma foto com nosso açaí na praia?",
            options: [
                "Só mais um dia normal",
                "Saboreando a vida em Bitupitá! 🌊🍇",
                "Odeio praia",
                "Queria estar em casa"
            ],
            correctIndex: 1
        },
        {
            category: "fun",
            difficulty: "facil",
            question: "Se nosso açaí fosse um atleta local, qual seria?",
            options: [
                "Um jogador de dominó",
                "Um kitesurfista profissional",
                "Um nadador de piscina",
                "Um ciclista de montanha"
            ],
            correctIndex: 1
        },
        
        // Ingredientes
        {
            question: "Qual é a principal fruta usada no açaí?",
            options: [
                "Palmeira Juçara",
                "Palmeira Açaí",
                "Palmeira Real",
                "Palmeira Imperial"
            ],
            correctIndex: 1,
            category: "ingredientes",
            explanation: "O açaí vem da Palmeira Açaí (Euterpe oleracea), nativa da região amazônica. Embora a Palmeira Juçara também produza frutos semelhantes, o verdadeiro açaí vem especificamente da Palmeira Açaí.",
            difficulty: "facil"
        },
        {
            question: "Qual é a cor natural do açaí puro?",
            options: [
                "Roxo escuro",
                "Vermelho",
                "Marrom",
                "Preto"
            ],
            correctIndex: 0,
            category: "caracteristicas",
            difficulty: "facil"
        },
        {
            question: "Em qual região do Brasil o açaí é mais consumido tradicionalmente?",
            options: [
                "Nordeste",
                "Norte",
                "Sul",
                "Sudeste"
            ],
            correctIndex: 1,
            category: "cultura",
            difficulty: "facil"
        },
        {
            question: "Qual é o principal benefício nutricional do açaí?",
            options: [
                "Alto teor de proteínas",
                "Alto teor de antioxidantes",
                "Alto teor de vitamina C",
                "Alto teor de cálcio"
            ],
            correctIndex: 1,
            category: "nutricao",
            difficulty: "medio"
        },
        {
            question: "Como o açaí é tradicionalmente consumido na região Norte?",
            options: [
                "Com granola e mel",
                "Com peixe e farinha",
                "Com leite condensado",
                "Com frutas"
            ],
            correctIndex: 1,
            category: "cultura",
            difficulty: "medio"
        },
        {
            question: "Qual é a melhor temperatura para servir o açaí?",
            options: [
                "-12°C a -10°C",
                "-8°C a -6°C",
                "-18°C a -15°C",
                "-22°C a -20°C"
            ],
            correctIndex: 2,
            category: "preparo",
            difficulty: "dificil"
        },
        {
            question: "Qual é o tempo médio de validade do açaí congelado?",
            options: [
                "1 mês",
                "6 meses",
                "1 ano",
                "2 anos"
            ],
            correctIndex: 1,
            category: "conservacao",
            difficulty: "medio"
        },
        {
            question: "Qual é a época de colheita do açaí?",
            options: [
                "Janeiro a Abril",
                "Maio a Agosto",
                "Julho a Dezembro",
                "Ano todo"
            ],
            correctIndex: 2,
            category: "producao",
            difficulty: "dificil"
        },
        {
            question: "Qual é o principal método de processamento do açaí?",
            options: [
                "Cozimento",
                "Fermentação",
                "Batimento",
                "Secagem"
            ],
            correctIndex: 2,
            category: "preparo",
            difficulty: "medio"
        },
        {
            question: "Qual é a classificação do açaí mais espesso?",
            options: [
                "Tipo A",
                "Tipo B",
                "Tipo C",
                "Popular"
            ],
            correctIndex: 0,
            category: "caracteristicas",
            difficulty: "dificil"
        },
        {
            question: "Quanto tempo o açaí pode ficar fora do freezer?",
            options: [
                "Até 2 horas",
                "Até 4 horas",
                "Até 6 horas",
                "Até 8 horas"
            ],
            correctIndex: 0,
            category: "conservacao",
            difficulty: "medio"
        },
        {
            question: "Qual é o principal acompanhamento do açaí no Sul/Sudeste?",
            options: [
                "Farinha de tapioca",
                "Granola",
                "Paçoca",
                "Castanha do Pará"
            ],
            correctIndex: 1,
            category: "cultura",
            difficulty: "facil"
        },
        {
            question: "Qual é o teor médio de gordura no açaí?",
            options: [
                "2-4%",
                "4-6%",
                "6-8%",
                "8-10%"
            ],
            correctIndex: 2,
            category: "nutricao",
            difficulty: "dificil"
        },
        {
            question: "Como identificar um açaí de boa qualidade?",
            options: [
                "Pela cor roxa intensa",
                "Pelo preço alto",
                "Pela textura cremosa",
                "Pelo sabor doce"
            ],
            correctIndex: 2,
            category: "caracteristicas",
            difficulty: "medio"
        },
        {
            question: "Qual é a altura média de uma palmeira de açaí?",
            options: [
                "5-10 metros",
                "15-20 metros",
                "25-30 metros",
                "35-40 metros"
            ],
            correctIndex: 1,
            category: "producao",
            difficulty: "dificil"
        },
        // PERGUNTAS ADICIONADAS AUTOMATICAMENTE - NÃO REMOVER ESTE BLOCO
        {
            category: "acai",
            difficulty: "facil",
            question: "O açaí é uma fruta típica de qual região do Brasil?",
            options: ["Sul", "Sudeste", "Nordeste", "Norte"],
            correctIndex: 3
        },
        {
            category: "acai",
            difficulty: "facil",
            question: "Qual é o nome científico da palmeira que produz o açaí?",
            options: ["Euterpe edulis", "Euterpe oleracea", "Elaeis guineensis", "Cocos nucifera"],
            correctIndex: 1
        },
        {
            category: "acai",
            difficulty: "medio",
            question: "Qual grupo indígena foi pioneiro no consumo do açaí?",
            options: ["Guaranis", "Tupinambás", "Ticunas", "Yanomamis"],
            correctIndex: 2
        },
        {
            category: "acai",
            difficulty: "medio",
            question: "Qual destes NÃO é um nome alternativo para o açaí?",
            options: ["Juçara", "Palmiteiro", "Açaizeiro", "Pupunha"],
            correctIndex: 3
        },
        {
            category: "acai",
            difficulty: "dificil",
            question: "Quantos frutos um único cacho de açaí pode produzir?",
            options: ["Até 500 frutos", "Até 1.000 frutos", "Até 3.000 frutos", "Até 6.000 frutos"],
            correctIndex: 3
        },
        {
            category: "acai",
            difficulty: "dificil",
            question: "Em qual tipo de ecossistema a palmeira de açaí cresce naturalmente?",
            options: ["Cerrado", "Caatinga", "Várzeas amazônicas", "Mata Atlântica litorânea"],
            correctIndex: 2
        },
        {
            category: "acai",
            difficulty: "facil",
            question: "Qual é a aparência do açaí quando maduro?",
            options: ["Amarelo-alaranjado", "Verde-claro", "Roxo-escuro quase preto", "Vermelho-vivo"],
            correctIndex: 2
        },
        {
            category: "acai",
            difficulty: "medio",
            question: "Qual parte da palmeira do açaí também é consumida como palmito?",
            options: ["As folhas", "As raízes", "O broto terminal (meristema)", "A casca do caule"],
            correctIndex: 2
        },
        {
            category: "acai",
            difficulty: "dificil",
            question: "Qual estado brasileiro é o maior produtor mundial de açaí?",
            options: ["Amazonas", "Bahia", "Pará", "Maranhão"],
            correctIndex: 2
        },
        {
            category: "acai",
            difficulty: "facil",
            question: "O açaí é classificado botanicamente como:",
            options: ["Legume", "Raiz tuberosa", "Baga", "Noz"],
            correctIndex: 2
        },
        {
            category: "producao",
            difficulty: "facil",
            question: "Como é chamado o trabalhador que sobe nas palmeiras para colher o açaí?",
            options: ["Boiadeiro", "Peconheiro", "Apicultor", "Vinhateiro"],
            correctIndex: 1
        },
        {
            category: "producao",
            difficulty: "facil",
            question: "Qual é o método tradicional de separação da polpa do caroço do açaí?",
            options: ["Fermentação", "Secagem ao sol", "Maceração com água", "Congelamento rápido"],
            correctIndex: 2
        },
        {
            category: "producao",
            difficulty: "medio",
            question: "Por que o açaí processado deve ser pasteurizado ou congelado rapidamente?",
            options: ["Para intensificar o sabor", "Para mudar sua cor natural", "Para evitar fermentação e perda nutricional", "Para aumentar o volume da polpa"],
            correctIndex: 2
        },
        {
            category: "producao",
            difficulty: "medio",
            question: "Qual etapa é essencial no processamento industrial do açaí para consumo seguro?",
            options: ["Adição de conservantes químicos", "Tratamento térmico (pasteurização)", "Liofilização", "Fermentação controlada"],
            correctIndex: 1
        },
        {
            category: "producao",
            difficulty: "dificil",
            question: "Quantos kg de frutos são necessários para produzir aproximadamente 1 litro de polpa de açaí?",
            options: ["1-2 kg", "3-4 kg", "5-7 kg", "8-10 kg"],
            correctIndex: 2
        },
        {
            category: "producao",
            difficulty: "dificil",
            question: "Qual técnica moderna ajuda a prolongar a vida útil da polpa de açaí sem perder nutrientes?",
            options: ["Ultracongelamento (-18°C ou inferior)", "Adição de açúcar cristal", "Processamento a vácuo", "Defumação controlada"],
            correctIndex: 0
        },
        {
            category: "producao",
            difficulty: "facil",
            question: "O açaí é colhido principalmente durante qual período?",
            options: ["Janeiro a março", "Abril a junho", "Julho a dezembro", "Durante todo o ano"],
            correctIndex: 2
        },
        {
            category: "producao",
            difficulty: "medio",
            question: "Qual é a principal ameaça à produção sustentável de açaí?",
            options: ["Excesso de chuva", "Desmatamento para expansão agrícola", "Pragas importadas", "Solo muito fértil"],
            correctIndex: 1
        },
        {
            category: "producao",
            difficulty: "dificil",
            question: "O que é o 'manejo de mínimo impacto' na colheita de açaí?",
            options: ["Colher apenas cachos maduros sem danificar a palmeira", "Usar máquinas pesadas para acelerar a colheita", "Plantar em monocultura com alta densidade", "Colher frutos verdes para maior durabilidade"],
            correctIndex: 0
        },
        {
            category: "producao",
            difficulty: "facil",
            question: "Como os cachos de açaí são transportados após a colheita?",
            options: ["Em caminhões refrigerados", "Em caixas plásticas herméticas", "Amarrados em feixes (paneiros)", "Processados imediatamente no local"],
            correctIndex: 2
        }
    ]
}; 