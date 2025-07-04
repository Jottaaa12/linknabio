// Banco de dados de perguntas do Quiz Sabor da Terra
const questionsDatabase = {
    // Configurações do quiz
    config: {
        questionsPerQuiz: 10, // Número de perguntas por quiz
        minCorrectForReward: 8, // Mínimo de acertos para ganhar recompensa (80%)
    },
    
    // Categorias de perguntas
    categories: {
        brand: "Marca e Posicionamento",
        product: "Produto e Ingredientes",
        local: "Bitupitá e Cultura Local",
        acai: "Conhecimento Geral sobre Açaí",
        fun: "Perguntas Divertidas"
    },
    
    // Banco de perguntas
    questions: [
        // Categoria: Marca e Posicionamento
        {
            category: "brand",
            question: "Qual é o slogan oficial que define a nossa proposta?",
            answers: [
                { text: "O açaí mais barato da cidade", correct: false },
                { text: "Mais que açaí, uma experiência", correct: true },
                { text: "Açaí rápido como o vento", correct: false },
                { text: "Self-service de felicidade", correct: false }
            ]
        },
        {
            category: "brand",
            question: "Como o Açaí Sabor da Terra se posiciona no mercado de Bitupitá?",
            answers: [
                { text: "Como uma opção de buffet livre (self-service)", correct: false },
                { text: "Como uma marca premium, focada em qualidade e atendimento", correct: true },
                { text: "Como a opção mais econômica da orla", correct: false },
                { text: "Como uma lanchonete com vários tipos de salgados", correct: false }
            ]
        },
        {
            category: "brand",
            question: "Qual a principal diferença do nosso serviço em comparação aos concorrentes?",
            answers: [
                { text: "Não temos diferença, vendemos a mesma coisa", correct: false },
                { text: "Nosso foco é em produto premium e pedidos à la carte", correct: true },
                { text: "Só abrimos pela manhã", correct: false },
                { text: "Vendemos apenas açaí com peixe", correct: false }
            ]
        },
        
        // Categoria: Produto e Ingredientes
        {
            category: "product",
            question: "Qual é o tipo de polpa de açaí que utilizamos em nossos produtos?",
            answers: [
                { text: "Polpa comum congelada", correct: false },
                { text: "Polpa Especial com maior concentração de fruta", correct: true },
                { text: "Polpa líquida diluída", correct: false },
                { text: "Polpa em pó reconstituída", correct: false }
            ]
        },
        {
            category: "product",
            question: "Qual é o diferencial do nosso açaí mais elogiado pelos clientes?",
            answers: [
                { text: "O preço baixo", correct: false },
                { text: "A cremosidade e sabor intenso", correct: true },
                { text: "A rapidez no preparo", correct: false },
                { text: "O tamanho da porção", correct: false }
            ]
        },
        
        // Categoria: Bitupitá e Cultura Local
        {
            category: "local",
            question: "Qual esporte é famoso em Bitupitá devido aos ventos fortes?",
            answers: [
                { text: "Surf tradicional", correct: false },
                { text: "Kitesurf", correct: true },
                { text: "Futebol de areia", correct: false },
                { text: "Vôlei de praia", correct: false }
            ]
        },
        {
            category: "local",
            question: "Qual é o melhor horário para apreciar a paisagem de Bitupitá?",
            answers: [
                { text: "Durante a chuva", correct: false },
                { text: "No pôr do sol", correct: true },
                { text: "Às 3 da manhã", correct: false },
                { text: "Meio-dia", correct: false }
            ]
        },
        
        // Categoria: Conhecimento Geral sobre Açaí
        {
            category: "acai",
            question: "De qual região do Brasil o açaí é nativo?",
            answers: [
                { text: "Sul", correct: false },
                { text: "Norte (Amazônia)", correct: true },
                { text: "Nordeste", correct: false },
                { text: "Sudeste", correct: false }
            ]
        },
        {
            category: "acai",
            question: "Qual o benefício mais conhecido do açaí?",
            answers: [
                { text: "Ajuda a dormir melhor", correct: false },
                { text: "Rico em antioxidantes", correct: true },
                { text: "Cura gripe", correct: false },
                { text: "Diminui o apetite", correct: false }
            ]
        },
        
        // Categoria: Perguntas Divertidas
        {
            category: "fun",
            question: "Qual seria a melhor legenda para uma foto com nosso açaí na praia?",
            answers: [
                { text: "Só mais um dia normal", correct: false },
                { text: "Saboreando a vida em Bitupitá! 🌊🍇", correct: true },
                { text: "Odeio praia", correct: false },
                { text: "Queria estar em casa", correct: false }
            ]
        },
        {
            category: "fun",
            question: "Se nosso açaí fosse um atleta local, qual seria?",
            answers: [
                { text: "Um jogador de dominó", correct: false },
                { text: "Um kitesurfista profissional", correct: true },
                { text: "Um nadador de piscina", correct: false },
                { text: "Um ciclista de montanha", correct: false }
            ]
        },
        
        // Você pode continuar adicionando mais perguntas aqui...
        // Basta seguir o mesmo formato:
        /*
        {
            category: "categoria",
            question: "Sua pergunta aqui?",
            answers: [
                { text: "Resposta errada", correct: false },
                { text: "Resposta certa", correct: true },
                { text: "Resposta errada", correct: false },
                { text: "Resposta errada", correct: false }
            ]
        },
        */
    ]
}; 
