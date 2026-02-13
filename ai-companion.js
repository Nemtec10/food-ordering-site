const aiPanel = document.querySelector('.ai-panel');
const aiFab = document.querySelector('.ai-fab');
const aiClose = document.querySelector('.ai-close');
const aiForm = document.querySelector('.ai-form');
const aiInput = document.querySelector('.ai-input');
const aiMessages = document.querySelector('.ai-messages');
const aiMode = document.querySelector('.ai-mode');
const aiAuth = document.querySelector('.ai-auth');
const aiAuthForm = document.querySelector('.ai-auth-form');
const aiAuthStatus = document.querySelector('.ai-auth-status');
const aiLogout = document.querySelector('.ai-logout');
const languageSelect = document.querySelector('#languageSelect');
const themeSelect = document.querySelector('#themeSelect');
const bgSelect = document.querySelector('#bgSelect');

let token = localStorage.getItem('netfoodixAuthToken') || '';
let userId = localStorage.getItem('netfoodixUserId') || '';
let conversationId = localStorage.getItem('netfoodixConversationId') || '';
let hasLoadedHistory = false;
let isDemoMode = localStorage.getItem('netfoodixDemoMode') === 'true';

const LANGUAGE_KEY = 'netfoodixLanguage';
const THEME_KEY = 'netfoodixTheme';
const BG_KEY = 'netfoodixBackground';

const i18n = {
  en: {
    ai_fab: 'Ask Netfoodix AI',
    ai_title: 'Netfoodix AI Companion',
    ai_subtitle: 'Ask questions or generate images with Netfoodix AI.',
    settings_title: 'Display settings',
    language_label: 'Language',
    theme_label: 'Theme',
    background_label: 'Background image',
    signin_note: 'Sign in to use full Netfoodix AI, or try Demo Mode to browse web info and calculate bills instantly.',
    signin_btn: 'Sign in',
    signup_btn: 'Sign up',
    demo_btn: 'Try Demo',
    mode_chat: 'Chat',
    mode_image: 'Image',
    send_btn: 'Send',
    logout_btn: 'Logout',
    close_chat: 'Close chat',
    auth_email_placeholder: 'Email',
    auth_password_placeholder: 'Password',
    ai_mode_label: 'AI mode',
    chat_placeholder: 'Ask about delivery, pricing, or support...',
    thinking: 'Netfoodix AI is thinking',
    signin_required: 'Please sign in to access Netfoodix AI.',
    welcome_demo: 'Welcome to Demo Mode. Ask a question to preview how Netfoodix AI behaves.',
    welcome_chat: 'Hi! Ask me anything about Netfoodix.',
    history_error: 'Could not load old chat history yet.',
    generated_image: 'Here is your generated image:',
    logged_out: 'Logged out.',
    site_title: 'NETFOODIX APP',
    site_sub: 'The smart worldwide app to order your food from wherever you are, so never miss a meal.',
    header_signin: 'Sign-in',
    header_get_started: 'Get Started',
    hero_title: 'WELCOME TO THE NETFOODIX APP',
    hero_marquee: 'Be aware of our introduction about the app, so that you know how interactive it is.',
    nav_home: 'HOME', nav_about: 'ABOUT US', nav_contact: 'CONTACT US', nav_services: 'SERVICES', nav_support: 'SUPPORT', nav_blog: 'BLOG', nav_faq: 'FAQ', nav_privacy: 'PRIVACY POLICY', nav_terms: 'TERMS OF SERVICE', nav_feedback: 'FEEDBACK',
    stat_orders_title: 'Minimum orders per day', stat_orders_value: '500K+ orders per day',
    stat_reach_title: 'Global Reach', stat_reach_value: 'Available in over 100 countries',
    stat_users_title: 'The number of users per day', stat_users_value: 'More than 1M users per day',
    stat_cuisines_title: 'Variety of Cuisines', stat_cuisines_value: 'Over 10K restaurants partnered',
    mission_title: 'OUR MISSION',
    mission_text: 'Our mission is to provide a seamless and efficient food ordering experience for users worldwide. We aim to connect customers with a diverse range of restaurants, ensuring that everyone has access to delicious meals at their fingertips. By leveraging cutting-edge AI technology, we strive to enhance convenience, speed, and satisfaction in every order placed through our app.',
    vision_title: 'OUR VISION',
    vision_text: 'Our vision is to become the leading global food ordering platform, recognized for innovation, reliability, and exceptional user experience. We envision a future where our app is the go-to solution for food lovers everywhere, fostering a vibrant community of customers and restaurant partners. Through continuous improvement and adaptation to emerging technologies, we aspire to set new standards in the food delivery industry and make dining more accessible and enjoyable for all.',
    to_netfoodix: 'To Netfoodix', next_home: 'Next to HOME',
    footer_made_with: 'Made with'
  },
  sw: { ai_fab:'Uliza Netfoodix AI', ai_title:'Msaidizi wa Netfoodix AI', ai_subtitle:'Uliza maswali au tengeneza picha kwa Netfoodix AI.', settings_title:'Mipangilio ya mwonekano', language_label:'Lugha', theme_label:'Mandhari', background_label:'Picha ya usuli', signin_note:'Ingia kutumia Netfoodix AI kikamilifu, au tumia Demo kuona utafutaji na mahesabu ya bili.', signin_btn:'Ingia', signup_btn:'Jisajili', demo_btn:'Jaribu Demo', mode_chat:'Mazungumzo', mode_image:'Picha', send_btn:'Tuma', logout_btn:'Toka', close_chat:'Funga gumzo', auth_email_placeholder:'Barua pepe', auth_password_placeholder:'Nenosiri', ai_mode_label:'Hali ya AI', chat_placeholder:'Uliza kuhusu usafirishaji, bei, au msaada...', thinking:'Netfoodix AI inafikiria', signin_required:'Tafadhali ingia ili kutumia Netfoodix AI.', welcome_demo:'Karibu kwenye Demo. Uliza swali kuona jinsi Netfoodix AI inavyofanya kazi.', welcome_chat:'Habari! Niulize chochote kuhusu Netfoodix.', history_error:'Imeshindikana kupakia historia ya mazungumzo.', generated_image:'Hii hapa picha uliyoomba:', logged_out:'Umetoka.', site_title:'PROGRAMU YA NETFOODIX', site_sub:'Programu mahiri duniani ya kuagiza chakula popote ulipo.', header_signin:'Ingia', header_get_started:'Anza', hero_title:'KARIBU KWENYE PROGRAMU YA NETFOODIX', hero_marquee:'Jifunze utangulizi wa programu ili ujue jinsi ilivyo shirikishi.', nav_home:'NYUMBANI', nav_about:'KUHUSU SISI', nav_contact:'WASILIANA NASI', nav_services:'HUDUMA', nav_support:'MSAADA', nav_blog:'BLOGU', nav_faq:'MASWALI', nav_privacy:'SERA YA FARAGHA', nav_terms:'MASHARTI YA HUDUMA', nav_feedback:'MAONI', stat_orders_title:'Kiwango cha oda kwa siku', stat_orders_value:'Oda 500K+ kwa siku', stat_reach_title:'Ufikivu wa Kimataifa', stat_reach_value:'Inapatikana nchi zaidi ya 100', stat_users_title:'Idadi ya watumiaji kwa siku', stat_users_value:'Watumiaji zaidi ya 1M kwa siku', stat_cuisines_title:'Aina za Vyakula', stat_cuisines_value:'Migahawa zaidi ya 10K washirika', mission_title:'DHAMIRA YETU', mission_text:'Dhamira yetu ni kutoa uzoefu rahisi na wenye ufanisi wa kuagiza chakula kwa watumiaji duniani kote.', vision_title:'MAONO YETU', vision_text:'Maono yetu ni kuwa jukwaa linaloongoza duniani la kuagiza chakula kwa ubunifu na kuaminika.', to_netfoodix:'Kwenda Netfoodix', next_home:'Ifuatayo NYUMBANI', footer_made_with:'Imetengenezwa na' },
  fr: { ai_fab:'Demander Netfoodix AI', ai_title:'Assistant Netfoodix AI', ai_subtitle:'Posez des questions ou générez des images avec Netfoodix AI.', settings_title:"Paramètres d'affichage", language_label:'Langue', theme_label:'Thème', background_label:'Image de fond', signin_note:'Connectez-vous pour utiliser Netfoodix AI, ou essayez le mode Démo.', signin_btn:'Se connecter', signup_btn:"S'inscrire", demo_btn:'Essayer Démo', mode_chat:'Chat', mode_image:'Image', send_btn:'Envoyer', logout_btn:'Déconnexion', close_chat:'Fermer le chat', auth_email_placeholder:'E-mail', auth_password_placeholder:'Mot de passe', ai_mode_label:'Mode IA', chat_placeholder:'Posez une question sur la livraison, le prix ou le support...', thinking:'Netfoodix AI réfléchit', signin_required:'Veuillez vous connecter pour accéder à Netfoodix AI.', welcome_demo:'Bienvenue en mode Démo.', welcome_chat:'Bonjour ! Posez-moi une question sur Netfoodix.', history_error:"Impossible de charger l'historique.", generated_image:'Voici votre image générée :', logged_out:'Déconnecté.', site_title:'APP NETFOODIX', site_sub:'Application mondiale intelligente pour commander votre repas où que vous soyez.', header_signin:'Se connecter', header_get_started:'Commencer', hero_title:"BIENVENUE DANS L'APP NETFOODIX", hero_marquee:"Découvrez notre introduction pour comprendre à quel point l'application est interactive.", nav_home:'ACCUEIL', nav_about:"À PROPOS", nav_contact:'CONTACT', nav_services:'SERVICES', nav_support:'SUPPORT', nav_blog:'BLOG', nav_faq:'FAQ', nav_privacy:'POLITIQUE DE CONFIDENTIALITÉ', nav_terms:'CONDITIONS DE SERVICE', nav_feedback:'AVIS', to_netfoodix:'Vers Netfoodix', next_home:'Aller à ACCUEIL', footer_made_with:'Créé avec' },
  pt: { ai_fab:'Perguntar ao Netfoodix AI', ai_title:'Assistente Netfoodix AI', ai_subtitle:'Faça perguntas ou gere imagens com o Netfoodix AI.', settings_title:'Configurações de exibição', language_label:'Idioma', theme_label:'Tema', background_label:'Imagem de fundo', signin_note:'Entre para usar o Netfoodix AI completo ou use o modo Demo.', signin_btn:'Entrar', signup_btn:'Cadastrar', demo_btn:'Testar Demo', mode_chat:'Chat', mode_image:'Imagem', send_btn:'Enviar', logout_btn:'Sair', close_chat:'Fechar chat', auth_email_placeholder:'E-mail', auth_password_placeholder:'Senha', ai_mode_label:'Modo IA', chat_placeholder:'Pergunte sobre entrega, preço ou suporte...', thinking:'Netfoodix AI está pensando', signin_required:'Faça login para usar o Netfoodix AI.', welcome_demo:'Bem-vindo ao modo Demo.', welcome_chat:'Olá! Pergunte qualquer coisa sobre o Netfoodix.', history_error:'Não foi possível carregar o histórico.', generated_image:'Aqui está sua imagem gerada:', logged_out:'Sessão encerrada.', site_title:'APP NETFOODIX', site_sub:'Aplicativo inteligente mundial para pedir comida de onde você estiver.', header_signin:'Entrar', header_get_started:'Começar', hero_title:'BEM-VINDO AO APP NETFOODIX', hero_marquee:'Veja nossa introdução para entender como o app é interativo.', nav_home:'INÍCIO', nav_about:'SOBRE NÓS', nav_contact:'CONTATO', nav_services:'SERVIÇOS', nav_support:'SUPORTE', nav_blog:'BLOG', nav_faq:'FAQ', nav_privacy:'POLÍTICA DE PRIVACIDADE', nav_terms:'TERMOS DE SERVIÇO', nav_feedback:'FEEDBACK', to_netfoodix:'Ir para Netfoodix', next_home:'Próximo para INÍCIO', footer_made_with:'Feito com' },
  zu: { ai_fab:'Buza i-Netfoodix AI', ai_title:'Usizo lwe-Netfoodix AI', ai_subtitle:'Buza imibuzo noma wakhe izithombe nge-Netfoodix AI.', settings_title:'Izilungiselelo zokubonisa', language_label:'Ulimi', theme_label:'Itimu', background_label:'Isithombe sangemuva', signin_note:'Ngena ukuze usebenzise i-Netfoodix AI ephelele noma uzame i-Demo.', signin_btn:'Ngena', signup_btn:'Bhalisa', demo_btn:'Zama i-Demo', mode_chat:'Ingxoxo', mode_image:'Isithombe', send_btn:'Thumela', logout_btn:'Phuma', close_chat:'Vala ingxoxo', auth_email_placeholder:'I-imeyili', auth_password_placeholder:'Iphasiwedi', ai_mode_label:'Imodi ye-AI', chat_placeholder:'Buza ngokulethwa, amanani noma usizo...', thinking:'I-Netfoodix AI iyacabanga', signin_required:'Sicela ungene ukuze usebenzise i-Netfoodix AI.', welcome_demo:'Wamukelekile ku-Demo mode.', welcome_chat:'Sawubona! Buza noma yini nge-Netfoodix.', history_error:'Ayikwazanga ukulayisha umlando.', generated_image:'Nansi isithombe sakho esikhiqiziwe:', logged_out:'Uphumile.', site_title:'I-NETFOODIX APP', site_sub:'Uhlelo oluhlakaniphile lomhlaba loku-oda ukudla noma kuphi lapho ukhona.', header_signin:'Ngena', header_get_started:'Qala', hero_title:'SIYAKWAMUKELA KU-NETFOODIX APP', hero_marquee:'Buka isingeniso sethu ukuze ubone ukuthi uhlelo lusebenza kanjani.', nav_home:'IKHAYA', nav_about:'MAYELANA NATHI', nav_contact:'XHUMANA NATHI', nav_services:'IZINSELO', nav_support:'USEKELO', nav_blog:'IBHULOGI', nav_faq:'IMIBUZO', nav_privacy:'INQUBOMGOMO YOBUMFIHLO', nav_terms:'IMIGOMO YENKONZO', nav_feedback:'IMPENDULO', to_netfoodix:'Iya ku-Netfoodix', next_home:'Okulandelayo IKHAYA', footer_made_with:'Kwenziwe nge' },
  es: { ai_fab:'Preguntar a Netfoodix AI', ai_title:'Asistente Netfoodix AI', ai_subtitle:'Haz preguntas o genera imágenes con Netfoodix AI.', settings_title:'Ajustes de pantalla', language_label:'Idioma', theme_label:'Tema', background_label:'Imagen de fondo', signin_note:'Inicia sesión para usar Netfoodix AI completo o prueba Demo.', signin_btn:'Iniciar sesión', signup_btn:'Registrarse', demo_btn:'Probar Demo', mode_chat:'Chat', mode_image:'Imagen', send_btn:'Enviar', logout_btn:'Cerrar sesión', close_chat:'Cerrar chat', auth_email_placeholder:'Correo', auth_password_placeholder:'Contraseña', ai_mode_label:'Modo IA', chat_placeholder:'Pregunta sobre entrega, precios o soporte...', thinking:'Netfoodix AI está pensando', signin_required:'Inicia sesión para acceder a Netfoodix AI.', welcome_demo:'Bienvenido al modo Demo.', welcome_chat:'¡Hola! Pregúntame lo que sea sobre Netfoodix.', history_error:'No se pudo cargar el historial.', generated_image:'Aquí está tu imagen generada:', logged_out:'Sesión cerrada.', site_title:'APP NETFOODIX', site_sub:'La app inteligente mundial para pedir comida desde donde estés.', header_signin:'Iniciar sesión', header_get_started:'Comenzar', hero_title:'BIENVENIDO A LA APP NETFOODIX', hero_marquee:'Mira nuestra introducción para conocer lo interactiva que es la app.', nav_home:'INICIO', nav_about:'SOBRE NOSOTROS', nav_contact:'CONTÁCTANOS', nav_services:'SERVICIOS', nav_support:'SOPORTE', nav_blog:'BLOG', nav_faq:'PREGUNTAS', nav_privacy:'POLÍTICA DE PRIVACIDAD', nav_terms:'TÉRMINOS DEL SERVICIO', nav_feedback:'COMENTARIOS', to_netfoodix:'Ir a Netfoodix', next_home:'Siguiente a INICIO', footer_made_with:'Hecho con' },
  de: { ai_fab:'Netfoodix AI fragen', ai_title:'Netfoodix AI Assistent', ai_subtitle:'Stelle Fragen oder erstelle Bilder mit Netfoodix AI.', settings_title:'Anzeigeeinstellungen', language_label:'Sprache', theme_label:'Thema', background_label:'Hintergrundbild', signin_note:'Melde dich an, um Netfoodix AI vollständig zu nutzen, oder nutze Demo.', signin_btn:'Anmelden', signup_btn:'Registrieren', demo_btn:'Demo testen', mode_chat:'Chat', mode_image:'Bild', send_btn:'Senden', logout_btn:'Abmelden', close_chat:'Chat schließen', auth_email_placeholder:'E-Mail', auth_password_placeholder:'Passwort', ai_mode_label:'KI-Modus', chat_placeholder:'Frage nach Lieferung, Preisen oder Support...', thinking:'Netfoodix AI denkt nach', signin_required:'Bitte melde dich an, um Netfoodix AI zu nutzen.', welcome_demo:'Willkommen im Demo-Modus.', welcome_chat:'Hi! Frag mich etwas über Netfoodix.', history_error:'Chatverlauf konnte nicht geladen werden.', generated_image:'Hier ist dein generiertes Bild:', logged_out:'Abgemeldet.', site_title:'NETFOODIX APP', site_sub:'Die smarte weltweite App zum Essen bestellen – von überall.', header_signin:'Anmelden', header_get_started:'Loslegen', hero_title:'WILLKOMMEN BEI DER NETFOODIX APP', hero_marquee:'Sieh dir unsere Einführung an, um die Interaktivität der App zu verstehen.', nav_home:'START', nav_about:'ÜBER UNS', nav_contact:'KONTAKT', nav_services:'DIENSTE', nav_support:'SUPPORT', nav_blog:'BLOG', nav_faq:'FAQ', nav_privacy:'DATENSCHUTZ', nav_terms:'NUTZUNGSBEDINGUNGEN', nav_feedback:'FEEDBACK', to_netfoodix:'Zu Netfoodix', next_home:'Weiter zu START', footer_made_with:'Erstellt mit' },
  ar: { ai_fab:'اسأل Netfoodix AI', ai_title:'مساعد Netfoodix AI', ai_subtitle:'اسأل أو أنشئ صورًا باستخدام Netfoodix AI.', settings_title:'إعدادات العرض', language_label:'اللغة', theme_label:'السمة', background_label:'صورة الخلفية', signin_note:'سجّل الدخول لاستخدام Netfoodix AI بالكامل أو جرّب وضع العرض التجريبي.', signin_btn:'تسجيل الدخول', signup_btn:'إنشاء حساب', demo_btn:'تجربة العرض', mode_chat:'دردشة', mode_image:'صورة', send_btn:'إرسال', logout_btn:'تسجيل الخروج', close_chat:'إغلاق الدردشة', auth_email_placeholder:'البريد الإلكتروني', auth_password_placeholder:'كلمة المرور', ai_mode_label:'وضع الذكاء الاصطناعي', chat_placeholder:'اسأل عن التوصيل أو الأسعار أو الدعم...', thinking:'Netfoodix AI يفكر', signin_required:'يرجى تسجيل الدخول للوصول إلى Netfoodix AI.', welcome_demo:'مرحبًا بك في وضع العرض التجريبي.', welcome_chat:'مرحبًا! اسألني أي شيء عن Netfoodix.', history_error:'تعذر تحميل سجل المحادثة الآن.', generated_image:'هذه هي الصورة التي تم إنشاؤها:', logged_out:'تم تسجيل الخروج.', site_title:'تطبيق NETFOODIX', site_sub:'تطبيق ذكي عالمي لطلب الطعام من أي مكان.', header_signin:'تسجيل الدخول', header_get_started:'ابدأ الآن', hero_title:'مرحبًا بك في تطبيق NETFOODIX', hero_marquee:'تعرّف على مقدمة التطبيق لتعرف مدى تفاعله.', nav_home:'الرئيسية', nav_about:'من نحن', nav_contact:'اتصل بنا', nav_services:'الخدمات', nav_support:'الدعم', nav_blog:'المدونة', nav_faq:'الأسئلة الشائعة', nav_privacy:'سياسة الخصوصية', nav_terms:'شروط الخدمة', nav_feedback:'الملاحظات', to_netfoodix:'إلى Netfoodix', next_home:'التالي إلى الرئيسية', footer_made_with:'صُنع بواسطة' },
  zh: { ai_fab:'询问 Netfoodix AI', ai_title:'Netfoodix AI 助手', ai_subtitle:'使用 Netfoodix AI 提问或生成图片。', settings_title:'显示设置', language_label:'语言', theme_label:'主题', background_label:'背景图片', signin_note:'登录以使用完整的 Netfoodix AI，或使用演示模式。', signin_btn:'登录', signup_btn:'注册', demo_btn:'试用演示', mode_chat:'聊天', mode_image:'图片', send_btn:'发送', logout_btn:'退出登录', close_chat:'关闭聊天', auth_email_placeholder:'邮箱', auth_password_placeholder:'密码', ai_mode_label:'AI 模式', chat_placeholder:'可询问配送、价格或支持...', thinking:'Netfoodix AI 正在思考', signin_required:'请先登录以使用 Netfoodix AI。', welcome_demo:'欢迎使用演示模式。', welcome_chat:'你好！欢迎询问 Netfoodix 相关问题。', history_error:'暂时无法加载历史记录。', generated_image:'这是你生成的图片：', logged_out:'已退出登录。', site_title:'NETFOODIX 应用', site_sub:'无论身在何处，都可智能下单点餐的全球应用。', header_signin:'登录', header_get_started:'开始使用', hero_title:'欢迎使用 NETFOODIX 应用', hero_marquee:'查看我们的应用介绍，了解它有多么互动。', nav_home:'首页', nav_about:'关于我们', nav_contact:'联系我们', nav_services:'服务', nav_support:'支持', nav_blog:'博客', nav_faq:'常见问题', nav_privacy:'隐私政策', nav_terms:'服务条款', nav_feedback:'反馈', to_netfoodix:'前往 Netfoodix', next_home:'下一步到首页', footer_made_with:'制作方' }
};

const pageSectionI18n = {
  fr: {
    stat_orders_title: 'Commandes minimales par jour',
    stat_orders_value: '500K+ commandes par jour',
    stat_reach_title: 'Portée mondiale',
    stat_reach_value: 'Disponible dans plus de 100 pays',
    stat_users_title: "Nombre d'utilisateurs par jour",
    stat_users_value: "Plus de 1M d'utilisateurs par jour",
    stat_cuisines_title: 'Variété de cuisines',
    stat_cuisines_value: 'Plus de 10K restaurants partenaires',
    mission_title: 'NOTRE MISSION',
    mission_text: 'Notre mission est de fournir une expérience de commande de repas fluide et efficace à des utilisateurs du monde entier. Nous relions les clients à une large gamme de restaurants pour que chacun puisse accéder facilement à de délicieux repas. Grâce aux technologies IA de pointe, nous améliorons la praticité, la rapidité et la satisfaction à chaque commande.',
    vision_title: 'NOTRE VISION',
    vision_text: "Notre vision est de devenir la principale plateforme mondiale de commande de repas, reconnue pour l'innovation, la fiabilité et une expérience utilisateur exceptionnelle. Nous voulons que notre application soit la solution de référence pour les amateurs de cuisine partout dans le monde."
  },
  pt: {
    stat_orders_title: 'Pedidos mínimos por dia',
    stat_orders_value: '500K+ pedidos por dia',
    stat_reach_title: 'Alcance global',
    stat_reach_value: 'Disponível em mais de 100 países',
    stat_users_title: 'Número de usuários por dia',
    stat_users_value: 'Mais de 1M de usuários por dia',
    stat_cuisines_title: 'Variedade de culinárias',
    stat_cuisines_value: 'Mais de 10K restaurantes parceiros',
    mission_title: 'NOSSA MISSÃO',
    mission_text: 'Nossa missão é oferecer uma experiência de pedido de comida simples e eficiente para usuários no mundo todo. Conectamos clientes a uma ampla variedade de restaurantes para que todos tenham acesso a refeições deliciosas com facilidade. Com tecnologia de IA de ponta, melhoramos conveniência, rapidez e satisfação em cada pedido.',
    vision_title: 'NOSSA VISÃO',
    vision_text: 'Nossa visão é nos tornar a principal plataforma global de pedidos de comida, reconhecida por inovação, confiabilidade e excelente experiência do usuário. Queremos que nosso app seja a solução de referência para amantes de comida em todo lugar.'
  },
  zu: {
    stat_orders_title: 'Ama-oda amancane ngosuku',
    stat_orders_value: '500K+ ama-oda ngosuku',
    stat_reach_title: 'Ukufinyelela emhlabeni wonke',
    stat_reach_value: 'Iyatholakala emazweni angaphezu kuka-100',
    stat_users_title: 'Inani labasebenzisi ngosuku',
    stat_users_value: 'Ngaphezu kuka-1M abasebenzisi ngosuku',
    stat_cuisines_title: 'Izinhlobo zokudla',
    stat_cuisines_value: 'Ngaphezu kuka-10K izindawo zokudlela ezisebenzisanayo',
    mission_title: 'UMGOMO WETHU',
    mission_text: 'Umgomo wethu ukuhlinzeka ngolwazi olulula nolusebenzayo loku-oda ukudla kubasebenzisi emhlabeni wonke. Sixhumanisa amakhasimende nezindawo zokudlela eziningi ukuze wonke umuntu afinyelele ukudla okumnandi kalula. Ngobuchwepheshe be-AI besimanje, sithuthukisa ukunethezeka, isivinini nokwaneliseka kuwo wonke ama-oda.',
    vision_title: 'UMBONO WETHU',
    vision_text: 'Umbono wethu ukuba yiplatifomu ehamba phambili emhlabeni yoku-oda ukudla, eyaziwa ngobusha, ukwethembeka nolwazi oluhle lomsebenzisi.'
  },
  es: {
    stat_orders_title: 'Pedidos mínimos por día',
    stat_orders_value: '500K+ pedidos por día',
    stat_reach_title: 'Alcance global',
    stat_reach_value: 'Disponible en más de 100 países',
    stat_users_title: 'Número de usuarios por día',
    stat_users_value: 'Más de 1M de usuarios por día',
    stat_cuisines_title: 'Variedad de cocinas',
    stat_cuisines_value: 'Más de 10K restaurantes asociados',
    mission_title: 'NUESTRA MISIÓN',
    mission_text: 'Nuestra misión es ofrecer una experiencia de pedido de comida fluida y eficiente para usuarios de todo el mundo. Conectamos a los clientes con una amplia variedad de restaurantes para que todos tengan acceso a comidas deliciosas al alcance de la mano. Con tecnología de IA de última generación, mejoramos la comodidad, la velocidad y la satisfacción en cada pedido.',
    vision_title: 'NUESTRA VISIÓN',
    vision_text: 'Nuestra visión es convertirnos en la plataforma global líder de pedidos de comida, reconocida por innovación, confiabilidad y excelente experiencia de usuario.'
  },
  de: {
    stat_orders_title: 'Mindestbestellungen pro Tag',
    stat_orders_value: '500K+ Bestellungen pro Tag',
    stat_reach_title: 'Globale Reichweite',
    stat_reach_value: 'In über 100 Ländern verfügbar',
    stat_users_title: 'Anzahl der Nutzer pro Tag',
    stat_users_value: 'Mehr als 1M Nutzer pro Tag',
    stat_cuisines_title: 'Vielfalt an Küchen',
    stat_cuisines_value: 'Über 10K Partnerrestaurants',
    mission_title: 'UNSERE MISSION',
    mission_text: 'Unsere Mission ist es, weltweit ein nahtloses und effizientes Essen-Bestellen zu ermöglichen. Wir verbinden Kundinnen und Kunden mit einer großen Auswahl an Restaurants, damit alle einfach Zugang zu leckerem Essen haben. Mit moderner KI-Technologie verbessern wir Komfort, Geschwindigkeit und Zufriedenheit bei jeder Bestellung.',
    vision_title: 'UNSERE VISION',
    vision_text: 'Unsere Vision ist es, die führende globale Plattform für Essensbestellungen zu werden – bekannt für Innovation, Zuverlässigkeit und eine hervorragende Nutzererfahrung.'
  },
  ar: {
    stat_orders_title: 'الحد الأدنى للطلبات يوميًا',
    stat_orders_value: 'أكثر من 500 ألف طلب يوميًا',
    stat_reach_title: 'انتشار عالمي',
    stat_reach_value: 'متاح في أكثر من 100 دولة',
    stat_users_title: 'عدد المستخدمين يوميًا',
    stat_users_value: 'أكثر من 1 مليون مستخدم يوميًا',
    stat_cuisines_title: 'تنوع المطابخ',
    stat_cuisines_value: 'أكثر من 10 آلاف مطعم شريك',
    mission_title: 'مهمتنا',
    mission_text: 'مهمتنا هي تقديم تجربة طلب طعام سلسة وفعالة للمستخدمين حول العالم. نهدف إلى ربط العملاء بمجموعة متنوعة من المطاعم لضمان وصول الجميع إلى وجبات لذيذة بسهولة. وباستخدام تقنيات الذكاء الاصطناعي المتقدمة، نسعى لتحسين الراحة والسرعة والرضا في كل طلب يتم عبر التطبيق.',
    vision_title: 'رؤيتنا',
    vision_text: 'رؤيتنا أن نصبح المنصة العالمية الرائدة لطلب الطعام، والمعروفة بالابتكار والموثوقية وتجربة المستخدم المميزة.'
  },
  zh: {
    stat_orders_title: '每日最低订单量',
    stat_orders_value: '每日超过 50 万订单',
    stat_reach_title: '全球覆盖',
    stat_reach_value: '已覆盖 100+ 国家',
    stat_users_title: '每日用户数量',
    stat_users_value: '每日超过 100 万用户',
    stat_cuisines_title: '菜系多样性',
    stat_cuisines_value: '合作餐厅超过 1 万家',
    mission_title: '我们的使命',
    mission_text: '我们的使命是为全球用户提供流畅高效的订餐体验。我们连接顾客与多样化餐厅，让每个人都能便捷享受美味餐食。通过先进的 AI 技术，我们持续提升每一笔订单的便捷性、速度与满意度。',
    vision_title: '我们的愿景',
    vision_text: '我们的愿景是成为全球领先的订餐平台，以创新、可靠和卓越用户体验而闻名。'
  }
};



const optionI18n = {
  en: {
    languages: { en: 'English', sw: 'Swahili', fr: 'French', pt: 'Portuguese', zu: 'Zulu', es: 'Spanish', de: 'German', zh: 'Chinese', ar: 'Arabic' },
    themes: { dark: 'Dark', light: 'Light', sun: 'Sun', emerald: 'Emerald', green: 'Green', blue: 'Blue', orange: 'Orange', purple: 'Purple' },
    backgrounds: { none: 'None', 'S2.png': 'Food 1', 'S5.png': 'Food 2', 'S9.png': 'Food 3' }
  },
  ar: {
    languages: { en: 'الإنجليزية', sw: 'السواحيلية', fr: 'الفرنسية', pt: 'البرتغالية', zu: 'الزولو', es: 'الإسبانية', de: 'الألمانية', zh: 'الصينية', ar: 'العربية' },
    themes: { dark: 'داكن', light: 'فاتح', sun: 'شمسي', emerald: 'زمردي', green: 'أخضر', blue: 'أزرق', orange: 'برتقالي', purple: 'أرجواني' },
    backgrounds: { none: 'بدون', 'S2.png': 'طعام 1', 'S5.png': 'طعام 2', 'S9.png': 'طعام 3' }
  }
};

const localizeSelectOptions = (lang) => {
  const dict = { ...optionI18n.en, ...(optionI18n[lang] || {}) };
  if (languageSelect) {
    [...languageSelect.options].forEach((opt) => {
      opt.textContent = (dict.languages || optionI18n.en.languages)[opt.value] || opt.value;
    });
  }
  if (themeSelect) {
    [...themeSelect.options].forEach((opt) => {
      opt.textContent = (dict.themes || optionI18n.en.themes)[opt.value] || opt.value;
    });
  }
  if (bgSelect) {
    [...bgSelect.options].forEach((opt) => {
      opt.textContent = (dict.backgrounds || optionI18n.en.backgrounds)[opt.value] || opt.value;
    });
  }
};

const getCurrentLanguage = () => languageSelect?.value || localStorage.getItem(LANGUAGE_KEY) || 'en';
const t = (key, lang = getCurrentLanguage()) => (i18n[lang] && i18n[lang][key]) || i18n.en[key] || key;

const applyLanguage = (lang) => {
  const dict = { ...i18n.en, ...(i18n[lang] || {}), ...(pageSectionI18n[lang] || {}) };
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) {
      el.placeholder = dict[key];
    }
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria-label');
    if (dict[key]) {
      el.setAttribute('aria-label', dict[key]);
    }
  });
  localizeSelectOptions(lang);
};

const applyTheme = (theme) => {
  const root = document.documentElement;
  root.classList.remove('light', 'dark', 'sun', 'emerald', 'green', 'blue', 'orange', 'purple');
  root.classList.add(theme || 'dark');
};

const applyBackground = (bg) => {
  const root = document.documentElement;
  if (!bg || bg === 'none') {
    root.style.setProperty('--bg-image', 'none');
    return;
  }
  root.style.setProperty('--bg-image', `url('${bg}')`);
};

const calculateDemoBill = (message = '') => {
  const normalized = message.toLowerCase();
  const subtotalMatch = normalized.match(/(?:subtotal|bill|amount)\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
  const tipMatch = normalized.match(/tip\s*[:=]?\s*(\d+(?:\.\d+)?)\s*%/i);
  const taxMatch = normalized.match(/tax\s*[:=]?\s*(\d+(?:\.\d+)?)\s*%/i);
  const splitMatch = normalized.match(/(?:split\s*(?:among|by|for)?\s*|for\s*)(\d+)\s*(?:people|persons|friends)?/i);

  if (!subtotalMatch) {
    return null;
  }

  const subtotal = Number(subtotalMatch[1]);
  const tipPercent = tipMatch ? Number(tipMatch[1]) : 0;
  const taxPercent = taxMatch ? Number(taxMatch[1]) : 0;
  const splitBy = splitMatch ? Math.max(1, Number(splitMatch[1])) : 1;

  if (!Number.isFinite(subtotal)) {
    return null;
  }

  const tipAmount = subtotal * (tipPercent / 100);
  const taxAmount = subtotal * (taxPercent / 100);
  const total = subtotal + tipAmount + taxAmount;
  const each = total / splitBy;

  return [
    'Bill calculation:',
    `- Subtotal: ${subtotal.toFixed(2)}`,
    `- Tip (${tipPercent}%): ${tipAmount.toFixed(2)}`,
    `- Tax (${taxPercent}%): ${taxAmount.toFixed(2)}`,
    `- Total: ${total.toFixed(2)}`,
    splitBy > 1 ? `- Split by ${splitBy}: ${each.toFixed(2)} each` : '',
  ]
    .filter(Boolean)
    .join('\n');
};

const getDemoFallbackResponse = (message = '') => {
  const normalized = message.toLowerCase();
  const bill = calculateDemoBill(message);
  if (bill) {
    return bill;
  }

  if (/(top|best).*(restaurant|food).*(tanzania)|tanzania.*(top|best).*(restaurant|food)/i.test(normalized)) {
    return [
      'Top restaurants in Tanzania (starter shortlist):',
      '- Dar es Salaam: Addis in Dar, Akemi Revolving Restaurant, Samaki Samaki.',
      '- Zanzibar: Lukmaan, Emerson on Hurumzi, The Silk Route.',
      '- Arusha: Fifi’s Restaurant, Khan’s BBQ, Blue Heron.',
      'Tip: check latest Google Maps ratings/hours before placing your order.',
    ].join('\n');
  }

  if (/(delivery|track|order)/.test(normalized)) {
    return 'Demo fallback: track orders in My Orders > Track to see ETA and rider location.';
  }
  if (/(price|fee|cost|bill|tip|tax|split|calculate|math)/.test(normalized)) {
    return 'Demo fallback: include details like "Bill 200 tip 10% tax 8% split 4" and I will calculate it.';
  }
  if (/(where|location|address|near|nearest|kfc|restaurant)/.test(normalized)) {
    return 'Demo fallback: I could not reach live web sources right now, but you can ask with a URL like "summarize https://example.com" for direct browsing context.';
  }
  return 'Demo fallback: add a webpage URL or ask a location question and I will try to browse and summarize helpful info.';
};

const mergeDemoFallbackIfNeeded = (message, responseText) => {
  const text = String(responseText || '').trim();
  if (!text) {
    return getDemoFallbackResponse(message);
  }

  const unreachable = /(couldn't fetch|could not reach|unavailable|network issue|timeout)/i.test(text);
  if (!unreachable) {
    return text;
  }

  return `${getDemoFallbackResponse(message)}\n\n${text}`;
};

const appendMessage = ({ text = '', type = 'user', imageUrl, isLoading = false }) => {
  const message = document.createElement('div');
  message.className = `ai-message ai-message--${type}`;

  if (isLoading) {
    message.classList.add('ai-message--loading');
    const thinkingWrap = document.createElement('div');
    thinkingWrap.className = 'ai-thinking';

    const thinkingImage = document.createElement('div');
    thinkingImage.className = 'ai-thinking-icon ai-thinking-icon--badge';
    thinkingImage.setAttribute('aria-hidden', 'true');
    thinkingImage.textContent = 'FY9V';

    const thinkingText = document.createElement('p');
    thinkingText.className = 'ai-thinking-text';
    thinkingText.textContent = t('thinking');

    thinkingWrap.appendChild(thinkingImage);
    thinkingWrap.appendChild(thinkingText);
    message.appendChild(thinkingWrap);
  } else {
    if (imageUrl) {
      const image = document.createElement('img');
      image.src = imageUrl;
      image.alt = text || 'Generated image';
      message.appendChild(image);
    }

    const paragraph = document.createElement('p');
    paragraph.className = 'ai-message-text';
    paragraph.textContent = text;
    message.appendChild(paragraph);
  }

  aiMessages.appendChild(message);
  aiMessages.scrollTop = aiMessages.scrollHeight;
  return message;
};

const setAuthStatus = (text, isError = false) => {
  if (!aiAuthStatus) return;
  aiAuthStatus.textContent = text;
  aiAuthStatus.style.color = isError ? '#ff9494' : 'var(--muted)';
};

const setAiEnabled = (enabled) => {
  if (aiAuth) aiAuth.style.display = enabled ? 'none' : 'block';
  if (aiForm) aiForm.style.display = enabled ? 'flex' : 'none';
  if (aiLogout) aiLogout.style.display = enabled ? 'inline-flex' : 'none';
  if (!enabled) {
    aiMessages.innerHTML = '';
    appendMessage({ text: t('signin_required'), type: 'bot' });
  }
};

const authFetch = async (url, options = {}) => {
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
};

const ensureMessageTextNode = (messageElement) => {
  let textNode = messageElement.querySelector('.ai-message-text');
  if (textNode) {
    return textNode;
  }

  const thinking = messageElement.querySelector('.ai-thinking');
  if (thinking) {
    thinking.remove();
  }

  textNode = document.createElement('p');
  textNode.className = 'ai-message-text';
  textNode.textContent = '';
  messageElement.appendChild(textNode);
  messageElement.classList.remove('ai-message--loading');
  return textNode;
};

const verifySession = async () => {
  if (isDemoMode) {
    setAiEnabled(true);
    return true;
  }

  if (!token) {
    setAiEnabled(false);
    return false;
  }

  try {
    const response = await authFetch('/api/auth/me');
    if (!response.ok) throw new Error('invalid session');
    const data = await response.json();
    userId = data.user?.id || userId;
    localStorage.setItem('netfoodixUserId', userId);
    setAiEnabled(true);
    return true;
  } catch {
    token = '';
    userId = '';
    conversationId = '';
    localStorage.removeItem('netfoodixAuthToken');
    localStorage.removeItem('netfoodixUserId');
    localStorage.removeItem('netfoodixConversationId');
    setAiEnabled(false);
    return false;
  }
};

const loadHistory = async () => {
  hasLoadedHistory = true;

  if (isDemoMode) {
    aiMessages.innerHTML = '';
    appendMessage({
      text: t('welcome_demo'),
      type: 'bot',
    });
    return;
  }

  if (!conversationId) {
    aiMessages.innerHTML = '';
    appendMessage({ text: t('welcome_chat'), type: 'bot' });
    return;
  }

  try {
    const response = await authFetch(`/api/messages/${conversationId}`);
    if (!response.ok) throw new Error('history failed');
    const data = await response.json();
    aiMessages.innerHTML = '';
    for (const message of data.messages || []) {
      appendMessage({ text: message.content, type: message.role === 'assistant' ? 'bot' : 'user' });
    }
  } catch {
    aiMessages.innerHTML = '';
    appendMessage({ text: t('history_error'), type: 'bot' });
  }
};

const updatePlaceholder = () => {
  const lang = localStorage.getItem(LANGUAGE_KEY) || 'en';
  const dict = { ...i18n.en, ...(i18n[lang] || {}), ...(pageSectionI18n[lang] || {}) };
  const imagePlaceholders = {
    en: 'Describe the image you want to create...',
    sw: 'Eleza picha unayotaka kutengeneza...',
    fr: "Décrivez l'image que vous voulez créer...",
    pt: 'Descreva a imagem que você quer criar...',
    zu: 'Chaza isithombe ofuna ukusenza...',
    es: 'Describe la imagen que quieres crear...',
    de: 'Beschreibe das Bild, das du erstellen möchtest...',
    zh: '请描述你想生成的图片...'
  };
  aiInput.placeholder =
    aiMode?.value === 'image'
      ? (imagePlaceholders[lang] || imagePlaceholders.en)
      : (dict.chat_placeholder || 'Ask about delivery, pricing, or support...');
};

const openPanel = async () => {
  aiPanel.classList.add('is-open');
  aiFab.setAttribute('aria-expanded', 'true');
  const loggedIn = await verifySession();
  if (loggedIn && !hasLoadedHistory) {
    await loadHistory();
  }
  aiInput.focus();
};

const closePanel = () => {
  aiPanel.classList.remove('is-open');
  aiFab.setAttribute('aria-expanded', 'false');
};

const enableDemoMode = async () => {
  isDemoMode = true;
  token = '';
  userId = '';
  conversationId = '';
  hasLoadedHistory = false;
  localStorage.removeItem('netfoodixAuthToken');
  localStorage.removeItem('netfoodixUserId');
  localStorage.removeItem('netfoodixConversationId');
  localStorage.setItem('netfoodixDemoMode', 'true');
  setAuthStatus('Demo mode enabled.');
  setAiEnabled(true);
  await loadHistory();
};

const handleAuthAction = async (mode) => {
  if (mode === 'demo') {
    await enableDemoMode();
    return;
  }

  const formData = new FormData(aiAuthForm);
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '').trim();

  if (!email || !password) {
    setAuthStatus('Email and password are required.', true);
    return;
  }

  setAuthStatus(mode === 'signup' ? 'Creating account...' : 'Signing in...');
  const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/signin';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Authentication failed');
    }

    isDemoMode = false;
    localStorage.removeItem('netfoodixDemoMode');
    token = data.token;
    userId = data.user.id;
    localStorage.setItem('netfoodixAuthToken', token);
    localStorage.setItem('netfoodixUserId', userId);
    setAuthStatus('Signed in successfully.');
    setAiEnabled(true);
    hasLoadedHistory = false;
    await loadHistory();
  } catch (error) {
    setAuthStatus(error.message || 'Authentication failed.', true);
  }
};

const streamChatResponse = async (message, botMessageElement) => {
  const response = await authFetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, message, language: getCurrentLanguage() }),
  });

  if (!response.ok || !response.body) {
    const errorData = await response.json().catch(() => ({ error: 'Stream request failed' }));
    throw new Error(errorData.error || 'Stream request failed');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const event of events) {
      if (!event.startsWith('data: ')) continue;
      const parsed = JSON.parse(event.slice(6));
      if (parsed.error) throw new Error(parsed.error);
      if (parsed.conversationId) {
        conversationId = parsed.conversationId;
        localStorage.setItem('netfoodixConversationId', conversationId);
      }
      if (parsed.delta) {
        fullText += parsed.delta;
        const textNode = ensureMessageTextNode(botMessageElement);
        textNode.textContent = fullText;
      }
    }
  }

  botMessageElement.classList.remove('ai-message--loading');
};

const runDemoResponse = async (message, botMessageElement) => {
  try {
    const response = await fetch('/api/demo/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, language: getCurrentLanguage() }),
    });

    if (!response.ok || !response.body) {
      throw new Error('Demo browsing is unavailable right now.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const event of events) {
        if (!event.startsWith('data: ')) continue;
        const parsed = JSON.parse(event.slice(6));
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.delta) {
          fullText += parsed.delta;
          const textNode = ensureMessageTextNode(botMessageElement);
          textNode.textContent = fullText;
        }
      }
    }

    const textNode = ensureMessageTextNode(botMessageElement);
    textNode.textContent = mergeDemoFallbackIfNeeded(message, fullText);

    botMessageElement.classList.remove('ai-message--loading');
  } catch {
    const textNode = ensureMessageTextNode(botMessageElement);
    textNode.textContent = getDemoFallbackResponse(message);
    botMessageElement.classList.remove('ai-message--loading');
  }
};

aiFab.addEventListener('click', () => {
  if (aiPanel.classList.contains('is-open')) closePanel();
  else openPanel();
});

aiClose.addEventListener('click', closePanel);
aiMode?.addEventListener('change', updatePlaceholder);
updatePlaceholder();

aiAuth?.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-auth-action]');
  if (!button) return;
  await handleAuthAction(button.dataset.authAction);
});

aiLogout?.addEventListener('click', async () => {
  if (token) {
    await authFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  }
  token = '';
  userId = '';
  conversationId = '';
  isDemoMode = false;
  localStorage.removeItem('netfoodixAuthToken');
  localStorage.removeItem('netfoodixUserId');
  localStorage.removeItem('netfoodixConversationId');
  localStorage.removeItem('netfoodixDemoMode');
  setAuthStatus(t('logged_out'));
  setAiEnabled(false);
});

aiForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = aiInput.value.trim();
  if (!message) return;

  appendMessage({ text: message, type: 'user' });
  aiInput.value = '';

  try {
    const botMessage = appendMessage({ text: '', type: 'bot', isLoading: true });

    if (isDemoMode) {
      await runDemoResponse(message, botMessage);
      return;
    }

    if ((aiMode?.value || 'chat') === 'image') {
      const response = await authFetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, prompt: message, language: getCurrentLanguage() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Image failed');
      if (data.conversationId) {
        conversationId = data.conversationId;
        localStorage.setItem('netfoodixConversationId', conversationId);
      }

      botMessage.innerHTML = '';
      botMessage.classList.remove('ai-message--loading');
      const textNode = document.createElement('p');
      textNode.className = 'ai-message-text';
      textNode.textContent = t('generated_image');
      botMessage.appendChild(textNode);
      const image = document.createElement('img');
      image.src = data.image;
      image.alt = 'Generated image';
      botMessage.appendChild(image);
      return;
    }

    await streamChatResponse(message, botMessage);
  } catch (error) {
    appendMessage({ text: error.message || 'Request failed.', type: 'bot' });
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && aiPanel.classList.contains('is-open')) {
    closePanel();
  }
});


const initDisplayControls = () => {
  const savedLang = localStorage.getItem(LANGUAGE_KEY) || 'en';
  const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
  const savedBg = localStorage.getItem(BG_KEY) || 'none';

  if (languageSelect) languageSelect.value = savedLang;
  if (themeSelect) themeSelect.value = savedTheme;
  if (bgSelect) bgSelect.value = savedBg;

  applyLanguage(savedLang);
  applyTheme(savedTheme);
  applyBackground(savedBg);

  languageSelect?.addEventListener('change', () => {
    const value = languageSelect.value;
    localStorage.setItem(LANGUAGE_KEY, value);
    applyLanguage(value);
  });

  themeSelect?.addEventListener('change', () => {
    const value = themeSelect.value;
    localStorage.setItem(THEME_KEY, value);
    applyTheme(value);
  });

  bgSelect?.addEventListener('change', () => {
    const value = bgSelect.value;
    localStorage.setItem(BG_KEY, value);
    applyBackground(value);
  });
};

initDisplayControls();

setAiEnabled(false);
verifySession();
