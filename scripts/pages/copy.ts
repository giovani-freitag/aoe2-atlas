import { SUPPORTED_LOCALES, type SupportedLocale } from '@/i18n/locales.ts';

/**
 * Everything the civilizations page says that is not read out of the data.
 *
 * Written per language rather than run through a translator at build time, and kept apart from
 * the builder because prose and plumbing change for different reasons. The vocabulary follows the
 * interface's own — a reader who meets "Weltwunder" in the atlas should not meet "Wunder" here.
 *
 * `{maps}`, `{first}`, `{last}`, `{carried}`, `{civs}` and `{odd}` are filled from the shipped
 * data, so no number in any language is typed by hand.
 */
export interface PageCopy {
    /** The short one, for the tab and the search result. */
    title: string;
    /** The long one, on the page, where nothing truncates it. */
    heading: string;
    description: string;
    lead: string;
    method: string;
    columns: {
        civilization: string;
        monument: string;
        where: string;
        onStage: string;
        drawnOn: string;
        widest: string;
    };
    /** How a stretch of maps reads: "800–1500 · 10 maps". */
    maps: { one: string; many: string };
    oddHeading: string;
    oddLead: string;
    backToAtlas: string;
    openTheAtlas: string;
    source: string;
    sources: string;
    disagreement: string;
    /** Said on the page in each of the other languages, so a reader can leave for theirs. */
    otherLanguages: string;
}

export const PAGE_COPY: Readonly<Record<SupportedLocale, PageCopy>> = {
    en: {
        title: 'Where the 56 Age of Empires II civilizations stood, and when',
        heading: 'Where every Age of Empires II civilization really stood, and for how long',
        description:
            'Where each of the 56 Age of Empires II civilizations actually was: the real monument its Wonder was modelled on, the city that monument stands in, and the centuries the atlas draws its realm.',
        lead: "Every civilization in Age of Empires II builds a Wonder modelled on a building that exists. This table names the building and the city it stands in, the years the game's own lore gives the realm, the dated maps the atlas draws it on, and how much ground it held when it was at its widest.",
        method:
            'The atlas is cut into {maps} dated maps between AD {first} and {last}. A realm is listed for every map it is drawn on, which includes the {carried} cases across all {civs} civilizations where the border had to be borrowed from the nearest mapped century — the atlas draws those faint. Areas are measured on the globe, so they compare whatever projection the map is opened in.',
        columns: {
            civilization: 'Civilization',
            monument: 'The Wonder is modelled on',
            where: 'Where it stands',
            onStage: 'On stage',
            drawnOn: 'Drawn on',
            widest: 'At its widest',
        },
        maps: { one: 'map', many: 'maps' },
        oddHeading: '{odd} Wonders that stand where their civilization never did',
        oddLead:
            'The game puts every Wonder on a building that exists, and for most of them the building is where the civilization was. These are the exceptions, and the atlas says so on each one rather than drawing the pin and leaving it. The monument is still real; what does not hold is the claim that the civilization stood there.',
        backToAtlas: '← The atlas',
        openTheAtlas: 'Open the atlas',
        source: 'Source',
        sources: 'Borders from {basemaps}, monuments from the {wiki}.',
        disagreement:
            'Where the wiki and the atlas disagree on where a Wonder stands — the Varangian one at Bolghar against Gnezdovo, the Mongol one at Avarga against Karakorum — the atlas says which it chose and why on the civilization’s own panel.',
        otherLanguages: 'In other languages',
    },

    'pt-BR': {
        title: 'Onde as 56 civilizações de Age of Empires II estavam, e quando',
        heading: 'Onde cada civilização de Age of Empires II esteve de verdade, e por quanto tempo',
        description:
            'Onde cada uma das 56 civilizações de Age of Empires II realmente estava: o monumento real em que sua Maravilha se inspira, a cidade onde esse monumento fica, e os séculos em que o atlas desenha seu território.',
        lead: 'Toda civilização de Age of Empires II ergue uma Maravilha inspirada num prédio que existe. Esta tabela nomeia o prédio e a cidade onde ele está, os anos que a própria narrativa do jogo dá ao reino, os mapas datados em que o atlas o desenha, e quanto chão ele ocupava no auge.',
        method:
            'O atlas é recortado em {maps} mapas datados entre {first} e {last} d.C. Um reino aparece em todo mapa em que é desenhado, o que inclui os {carried} casos, entre as {civs} civilizações, em que a fronteira teve de ser emprestada do século mapeado mais próximo — o atlas desenha essas mais fracas. As áreas são medidas sobre o globo, então se comparam em qualquer projeção.',
        columns: {
            civilization: 'Civilização',
            monument: 'A Maravilha se inspira em',
            where: 'Onde fica',
            onStage: 'Em cena',
            drawnOn: 'Desenhada em',
            widest: 'No auge',
        },
        maps: { one: 'mapa', many: 'mapas' },
        oddHeading: '{odd} Maravilhas que ficam onde sua civilização nunca esteve',
        oddLead:
            'O jogo põe cada Maravilha num prédio que existe, e na maioria dos casos o prédio fica onde a civilização estava. Estas são as exceções, e o atlas diz isso em cada uma em vez de fincar o alfinete e calar. O monumento continua real; o que não se sustenta é a alegação de que a civilização esteve ali.',
        backToAtlas: '← O atlas',
        openTheAtlas: 'Abrir o atlas',
        source: 'Código',
        sources: 'Fronteiras de {basemaps}, monumentos da {wiki}.',
        disagreement:
            'Onde a wiki e o atlas discordam sobre onde fica uma Maravilha — a varegue em Bolghar contra Gnezdovo, a mongol em Avarga contra Caracórum — o atlas diz qual escolheu e por quê no painel da própria civilização.',
        otherLanguages: 'Em outros idiomas',
    },

    es: {
        title: 'Dónde estuvieron las 56 civilizaciones de Age of Empires II, y cuándo',
        heading: 'Dónde estuvo de verdad cada civilización de Age of Empires II, y durante cuánto tiempo',
        description:
            'Dónde estuvo realmente cada una de las 56 civilizaciones de Age of Empires II: el monumento real en que se inspira su Maravilla, la ciudad donde se alza y los siglos en que el atlas dibuja su territorio.',
        lead: 'Toda civilización de Age of Empires II levanta una Maravilla inspirada en un edificio que existe. Esta tabla nombra el edificio y la ciudad donde está, los años que el propio relato del juego da al reino, los mapas fechados en que el atlas lo dibuja, y cuánto terreno ocupaba en su mayor extensión.',
        method:
            'El atlas está cortado en {maps} mapas fechados entre el año {first} y el {last}. Un reino aparece en cada mapa en que se dibuja, lo que incluye los {carried} casos, de las {civs} civilizaciones, en que la frontera hubo de tomarse prestada del siglo cartografiado más cercano: el atlas las dibuja tenues. Las áreas se miden sobre el globo, así que se comparan en cualquier proyección.',
        columns: {
            civilization: 'Civilización',
            monument: 'La Maravilla se inspira en',
            where: 'Dónde se alza',
            onStage: 'En escena',
            drawnOn: 'Dibujada en',
            widest: 'En su mayor extensión',
        },
        maps: { one: 'mapa', many: 'mapas' },
        oddHeading: '{odd} Maravillas que se alzan donde su civilización nunca estuvo',
        oddLead:
            'El juego pone cada Maravilla en un edificio que existe, y en la mayoría el edificio está donde estuvo la civilización. Estas son las excepciones, y el atlas lo dice en cada una en vez de clavar la chincheta y callar. El monumento sigue siendo real; lo que no se sostiene es la afirmación de que la civilización estuvo allí.',
        backToAtlas: '← El atlas',
        openTheAtlas: 'Abrir el atlas',
        source: 'Código',
        sources: 'Fronteras de {basemaps}, monumentos de la {wiki}.',
        disagreement:
            'Donde la wiki y el atlas discrepan sobre dónde se alza una Maravilla — la varega en Bolghar frente a Gnezdovo, la mongola en Avarga frente a Karakórum — el atlas dice cuál eligió y por qué en el panel de la propia civilización.',
        otherLanguages: 'En otros idiomas',
    },

    'es-MX': {
        title: 'Dónde estuvieron las 56 civilizaciones de Age of Empires II, y cuándo',
        heading: 'Dónde estuvo de verdad cada civilización de Age of Empires II, y durante cuánto tiempo',
        description:
            'Dónde estuvo realmente cada una de las 56 civilizaciones de Age of Empires II: el monumento real en que se inspira su Maravilla, la ciudad donde se alza y los siglos en que el atlas dibuja su territorio.',
        lead: 'Toda civilización de Age of Empires II levanta una Maravilla inspirada en un edificio que existe. Esta tabla nombra el edificio y la ciudad donde está, los años que el propio relato del juego da al reino, los mapas fechados en que el atlas lo dibuja, y cuánto terreno ocupaba en su mayor extensión.',
        method:
            'El atlas está cortado en {maps} mapas fechados entre el año {first} y el {last}. Un reino aparece en cada mapa en que se dibuja, lo que incluye los {carried} casos, de las {civs} civilizaciones, en que la frontera hubo de tomarse prestada del siglo cartografiado más cercano: el atlas las dibuja tenues. Las áreas se miden sobre el globo, así que se comparan en cualquier proyección.',
        columns: {
            civilization: 'Civilización',
            monument: 'La Maravilla se inspira en',
            where: 'Dónde se alza',
            onStage: 'En escena',
            drawnOn: 'Dibujada en',
            widest: 'En su mayor extensión',
        },
        maps: { one: 'mapa', many: 'mapas' },
        oddHeading: '{odd} Maravillas que se alzan donde su civilización nunca estuvo',
        oddLead:
            'El juego pone cada Maravilla en un edificio que existe, y en la mayoría el edificio está donde estuvo la civilización. Estas son las excepciones, y el atlas lo dice en cada una en vez de clavar la chincheta y callar. El monumento sigue siendo real; lo que no se sostiene es la afirmación de que la civilización estuvo allí.',
        backToAtlas: '← El atlas',
        openTheAtlas: 'Abrir el atlas',
        source: 'Código',
        sources: 'Fronteras de {basemaps}, monumentos de la {wiki}.',
        disagreement:
            'Donde la wiki y el atlas discrepan sobre dónde se alza una Maravilla — la varega en Bolghar frente a Gnezdovo, la mongola en Avarga frente a Karakórum — el atlas dice cuál eligió y por qué en el panel de la propia civilización.',
        otherLanguages: 'En otros idiomas',
    },

    fr: {
        title: 'Où se trouvaient les 56 civilisations d’Age of Empires II, et quand',
        heading: 'Où chaque civilisation d’Age of Empires II se trouvait vraiment, et pour combien de temps',
        description:
            'Où se trouvait réellement chacune des 56 civilisations d’Age of Empires II : le monument réel dont s’inspire sa Merveille, la ville où il se dresse, et les siècles où l’atlas dessine son territoire.',
        lead: 'Chaque civilisation d’Age of Empires II bâtit une Merveille inspirée d’un édifice qui existe. Ce tableau nomme l’édifice et la ville où il se dresse, les années que le récit du jeu donne au royaume, les cartes datées où l’atlas le dessine, et l’étendue qu’il occupait à son apogée.',
        method:
            'L’atlas est découpé en {maps} cartes datées entre {first} et {last} apr. J.-C. Un royaume figure sur chaque carte où il est dessiné, ce qui comprend les {carried} cas, parmi les {civs} civilisations, où la frontière a dû être empruntée au siècle cartographié le plus proche — l’atlas les dessine plus pâles. Les aires sont mesurées sur le globe : elles se comparent quelle que soit la projection.',
        columns: {
            civilization: 'Civilisation',
            monument: 'La Merveille s’inspire de',
            where: 'Où elle se dresse',
            onStage: 'En scène',
            drawnOn: 'Dessinée sur',
            widest: 'À son apogée',
        },
        maps: { one: 'carte', many: 'cartes' },
        oddHeading: '{odd} Merveilles qui se dressent là où leur civilisation n’a jamais été',
        oddLead:
            'Le jeu place chaque Merveille sur un édifice qui existe, et dans la plupart des cas cet édifice se trouve là où la civilisation était. Voici les exceptions, et l’atlas le dit sur chacune au lieu de planter l’épingle et de se taire. Le monument reste réel ; ce qui ne tient pas, c’est l’idée que la civilisation s’y trouvait.',
        backToAtlas: '← L’atlas',
        openTheAtlas: 'Ouvrir l’atlas',
        source: 'Code source',
        sources: 'Frontières de {basemaps}, monuments du {wiki}.',
        disagreement:
            'Là où le wiki et l’atlas divergent sur l’emplacement d’une Merveille — celle des Varègues à Bolghar contre Gniozdovo, celle des Mongols à Avarga contre Karakorum — l’atlas dit lequel il a retenu et pourquoi, sur le panneau de la civilisation.',
        otherLanguages: 'Dans d’autres langues',
    },

    de: {
        title: 'Wo die 56 Zivilisationen von Age of Empires II standen, und wann',
        heading: 'Wo jede Zivilisation von Age of Empires II wirklich stand, und wie lange',
        description:
            'Wo jede der 56 Zivilisationen von Age of Empires II tatsächlich war: das reale Bauwerk, dem ihr Weltwunder nachempfunden ist, die Stadt, in der es steht, und die Jahrhunderte, in denen der Atlas ihr Reich zeichnet.',
        lead: 'Jede Zivilisation in Age of Empires II errichtet ein Weltwunder nach dem Vorbild eines Bauwerks, das es gibt. Diese Tabelle nennt das Bauwerk und die Stadt, in der es steht, die Jahre, die das Spiel dem Reich selbst gibt, die datierten Karten, auf denen der Atlas es zeichnet, und wie viel Boden es auf seinem Höhepunkt hielt.',
        method:
            'Der Atlas ist in {maps} datierte Karten zwischen {first} und {last} n. Chr. geschnitten. Ein Reich steht auf jeder Karte, auf der es gezeichnet wird — darunter die {carried} Fälle unter allen {civs} Zivilisationen, in denen die Grenze vom nächstgelegenen kartierten Jahrhundert geliehen werden musste; der Atlas zeichnet diese blass. Flächen werden auf der Kugel gemessen und sind daher in jeder Projektion vergleichbar.',
        columns: {
            civilization: 'Zivilisation',
            monument: 'Das Weltwunder folgt',
            where: 'Wo es steht',
            onStage: 'Auf der Bühne',
            drawnOn: 'Gezeichnet auf',
            widest: 'Auf dem Höhepunkt',
        },
        maps: { one: 'Karte', many: 'Karten' },
        oddHeading: '{odd} Weltwunder, die dort stehen, wo ihre Zivilisation nie war',
        oddLead:
            'Das Spiel stellt jedes Weltwunder auf ein Bauwerk, das es gibt, und meistens steht dieses Bauwerk dort, wo die Zivilisation war. Dies sind die Ausnahmen, und der Atlas sagt es bei jeder einzelnen, statt die Nadel zu setzen und zu schweigen. Das Bauwerk bleibt echt; was nicht trägt, ist die Behauptung, die Zivilisation habe dort gestanden.',
        backToAtlas: '← Der Atlas',
        openTheAtlas: 'Atlas öffnen',
        source: 'Quellcode',
        sources: 'Grenzen von {basemaps}, Bauwerke aus dem {wiki}.',
        disagreement:
            'Wo Wiki und Atlas sich uneins sind, wo ein Weltwunder steht — das warägische in Bolghar gegen Gnjosdowo, das mongolische in Avarga gegen Karakorum — nennt der Atlas im Panel der Zivilisation, welches er gewählt hat und warum.',
        otherLanguages: 'In anderen Sprachen',
    },

    it: {
        title: 'Dove si trovavano le 56 civiltà di Age of Empires II, e quando',
        heading: 'Dove ogni civiltà di Age of Empires II si trovava davvero, e per quanto tempo',
        description:
            'Dove si trovava davvero ciascuna delle 56 civiltà di Age of Empires II: il monumento reale a cui si ispira la sua Meraviglia, la città in cui sorge e i secoli in cui l’atlante disegna il suo territorio.',
        lead: 'Ogni civiltà di Age of Empires II erige una Meraviglia ispirata a un edificio che esiste. Questa tabella nomina l’edificio e la città in cui sorge, gli anni che il racconto del gioco dà al regno, le mappe datate su cui l’atlante lo disegna, e quanto terreno teneva al suo apogeo.',
        method:
            'L’atlante è tagliato in {maps} mappe datate tra il {first} e il {last} d.C. Un regno compare su ogni mappa in cui è disegnato, compresi i {carried} casi, sulle {civs} civiltà, in cui il confine è stato preso in prestito dal secolo cartografato più vicino: l’atlante li disegna tenui. Le aree sono misurate sul globo, quindi si confrontano in qualsiasi proiezione.',
        columns: {
            civilization: 'Civiltà',
            monument: 'La Meraviglia si ispira a',
            where: 'Dove sorge',
            onStage: 'In scena',
            drawnOn: 'Disegnata su',
            widest: 'Al suo apogeo',
        },
        maps: { one: 'mappa', many: 'mappe' },
        oddHeading: '{odd} Meraviglie che sorgono dove la loro civiltà non è mai stata',
        oddLead:
            'Il gioco mette ogni Meraviglia su un edificio che esiste, e per la maggior parte quell’edificio sta dove stava la civiltà. Queste sono le eccezioni, e l’atlante lo dice su ciascuna invece di piantare lo spillo e tacere. Il monumento resta reale; ciò che non regge è la pretesa che la civiltà fosse lì.',
        backToAtlas: '← L’atlante',
        openTheAtlas: 'Apri l’atlante',
        source: 'Codice',
        sources: 'Confini da {basemaps}, monumenti dalla {wiki}.',
        disagreement:
            'Dove la wiki e l’atlante non concordano su dove sorga una Meraviglia — quella variaga a Bolghar contro Gnëzdovo, quella mongola ad Avarga contro Karakorum — l’atlante dice quale ha scelto e perché nel pannello della civiltà.',
        otherLanguages: 'In altre lingue',
    },

    pl: {
        title: 'Gdzie stało 56 cywilizacji Age of Empires II i kiedy',
        heading: 'Gdzie naprawdę stała każda cywilizacja Age of Empires II i jak długo',
        description:
            'Gdzie naprawdę była każda z 56 cywilizacji Age of Empires II: prawdziwa budowla, na której wzorowano jej Cud, miasto, w którym stoi, i stulecia, w których atlas rysuje jej państwo.',
        lead: 'Każda cywilizacja w Age of Empires II wznosi Cud wzorowany na budowli, która istnieje. Ta tabela podaje budowlę i miasto, w którym stoi, lata, jakie samo podanie gry daje państwu, datowane mapy, na których atlas je rysuje, oraz ile ziemi zajmowało u szczytu.',
        method:
            'Atlas jest pocięty na {maps} datowanych map między {first} a {last} rokiem n.e. Państwo pojawia się na każdej mapie, na której jest rysowane — w tym w {carried} przypadkach spośród {civs} cywilizacji, gdzie granicę trzeba było pożyczyć z najbliższego zmapowanego stulecia; atlas rysuje je bladziej. Powierzchnie mierzone są na kuli, więc porównują się w każdym odwzorowaniu.',
        columns: {
            civilization: 'Cywilizacja',
            monument: 'Cud wzorowany na',
            where: 'Gdzie stoi',
            onStage: 'Na scenie',
            drawnOn: 'Rysowana na',
            widest: 'U szczytu',
        },
        maps: { one: 'mapa', many: 'map' },
        oddHeading: 'Cudów, które stoją tam, gdzie ich cywilizacji nigdy nie było: {odd}',
        oddLead:
            'Gra stawia każdy Cud na budowli, która istnieje, i w większości przypadków budowla stoi tam, gdzie była cywilizacja. Oto wyjątki — atlas mówi o tym przy każdym z nich, zamiast wbić szpilkę i zamilknąć. Budowla pozostaje prawdziwa; nie broni się twierdzenie, że stała tam cywilizacja.',
        backToAtlas: '← Atlas',
        openTheAtlas: 'Otwórz atlas',
        source: 'Kod źródłowy',
        sources: 'Granice z {basemaps}, budowle z {wiki}.',
        disagreement:
            'Tam, gdzie wiki i atlas różnią się co do miejsca Cudu — wareski w Bołgarze wobec Gniezdowa, mongolski w Awardze wobec Karakorum — atlas mówi, który wybrał i dlaczego, w panelu danej cywilizacji.',
        otherLanguages: 'W innych językach',
    },

    ru: {
        title: 'Где стояли 56 цивилизаций Age of Empires II и когда',
        heading: 'Где на самом деле стояла каждая цивилизация Age of Empires II и как долго',
        description:
            'Где на самом деле была каждая из 56 цивилизаций Age of Empires II: реальное здание, по образцу которого сделано её Чудо света, город, в котором оно стоит, и века, в которые атлас рисует её державу.',
        lead: 'Каждая цивилизация в Age of Empires II возводит Чудо света по образцу здания, которое существует. В этой таблице — само здание и город, где оно стоит, годы, которые игра отводит державе, датированные карты, на которых атлас её рисует, и сколько земли она держала на пике.',
        method:
            'Атлас нарезан на {maps} датированных карт между {first} и {last} годами н. э. Держава показана на каждой карте, где она нарисована, включая {carried} случаев из {civs} цивилизаций, когда границу пришлось занять у ближайшего картированного века, — такие атлас рисует бледнее. Площади измерены на шаре, поэтому сравнимы в любой проекции.',
        columns: {
            civilization: 'Цивилизация',
            monument: 'Чудо света по образцу',
            where: 'Где стоит',
            onStage: 'На сцене',
            drawnOn: 'Нарисована на',
            widest: 'На пике',
        },
        maps: { one: 'карта', many: 'карт' },
        oddHeading: 'Чудес света, стоящих там, где их цивилизации не было: {odd}',
        oddLead:
            'Игра ставит каждое Чудо света на здание, которое существует, и чаще всего это здание стоит там, где была цивилизация. Вот исключения — атлас говорит об этом у каждого, а не втыкает булавку и молчит. Здание остаётся настоящим; не выдерживает лишь утверждение, что цивилизация стояла там.',
        backToAtlas: '← Атлас',
        openTheAtlas: 'Открыть атлас',
        source: 'Исходный код',
        sources: 'Границы из {basemaps}, памятники из {wiki}.',
        disagreement:
            'Там, где вики и атлас расходятся в том, где стоит Чудо света — варяжское в Болгаре против Гнёздова, монгольское в Аварге против Каракорума, — атлас говорит, что выбрал и почему, на панели самой цивилизации.',
        otherLanguages: 'На других языках',
    },

    tr: {
        title: 'Age of Empires II’nin 56 uygarlığı nerede ve ne zaman vardı',
        heading: 'Age of Empires II’nin her uygarlığı gerçekte neredeydi ve ne kadar sürdü',
        description:
            'Age of Empires II’nin 56 uygarlığından her birinin gerçekte nerede olduğu: Harikası’nın örnek aldığı gerçek yapı, o yapının bulunduğu şehir ve atlasın o toprakları çizdiği yüzyıllar.',
        lead: 'Age of Empires II’deki her uygarlık, var olan bir yapıyı örnek alan bir Harika diker. Bu tablo yapıyı ve bulunduğu şehri, oyunun kendi anlatısının o topraklara verdiği yılları, atlasın onu çizdiği tarihli haritaları ve en geniş hâlinde ne kadar toprak tuttuğunu verir.',
        method:
            'Atlas, MS {first} ile {last} arasında {maps} tarihli haritaya bölünmüştür. Bir toprak, çizildiği her haritada listelenir; buna {civs} uygarlık içinde sınırın en yakın haritalanmış yüzyıldan ödünç alınmak zorunda kalındığı {carried} durum da dâhildir — atlas bunları soluk çizer. Alanlar küre üzerinde ölçülür, bu yüzden hangi izdüşümde açılırsa açılsın karşılaştırılabilir.',
        columns: {
            civilization: 'Uygarlık',
            monument: 'Harika şunu örnek alır',
            where: 'Nerede duruyor',
            onStage: 'Sahnede',
            drawnOn: 'Şurada çizili',
            widest: 'En geniş hâli',
        },
        maps: { one: 'harita', many: 'harita' },
        oddHeading: 'Uygarlığının hiç bulunmadığı yerde duran {odd} Harika',
        oddLead:
            'Oyun her Harika’yı var olan bir yapıya oturtur ve çoğunda o yapı, uygarlığın bulunduğu yerdedir. Bunlar istisnalar; atlas iğneyi saplayıp susmak yerine her birinde bunu söyler. Yapı hâlâ gerçektir; tutmayan şey, uygarlığın orada durduğu iddiasıdır.',
        backToAtlas: '← Atlas',
        openTheAtlas: 'Atlası aç',
        source: 'Kaynak kod',
        sources: 'Sınırlar {basemaps} kaynağından, yapılar {wiki} kaynağından.',
        disagreement:
            'Wiki ile atlasın bir Harika’nın yeri konusunda ayrıştığı yerlerde — Varyaglarınki Bolgar’a karşı Gnezdovo, Moğollarınki Avarga’ya karşı Karakurum — atlas hangisini seçtiğini ve nedenini uygarlığın kendi panelinde söyler.',
        otherLanguages: 'Diğer dillerde',
    },

    hi: {
        title: 'Age of Empires II की 56 सभ्यताएँ कहाँ थीं, और कब',
        heading: 'Age of Empires II की हर सभ्यता सचमुच कहाँ थी, और कब तक',
        description:
            'Age of Empires II की 56 सभ्यताओं में से हर एक असल में कहाँ थी: उसका अजूबा जिस असली इमारत पर बना है, वह इमारत जिस शहर में है, और वे सदियाँ जिनमें एटलस उसका क्षेत्र खींचता है।',
        lead: 'Age of Empires II की हर सभ्यता एक अजूबा बनाती है, जो किसी मौजूद इमारत पर आधारित है। यह तालिका उस इमारत और उसके शहर का नाम देती है, वे वर्ष जो खेल की अपनी कथा उस राज्य को देती है, वे तिथिबद्ध नक्शे जिन पर एटलस उसे खींचता है, और चरम पर उसने कितनी ज़मीन रखी।',
        method:
            'एटलस {first} से {last} ईस्वी के बीच {maps} तिथिबद्ध नक्शों में कटा है। कोई राज्य हर उस नक्शे पर सूचीबद्ध है जिस पर वह खींचा गया है — इसमें {civs} सभ्यताओं में से वे {carried} मामले भी हैं जहाँ सीमा को निकटतम मानचित्रित सदी से उधार लेना पड़ा; एटलस उन्हें हल्का खींचता है। क्षेत्रफल गोले पर मापे गए हैं, इसलिए किसी भी प्रक्षेप में तुलनीय हैं।',
        columns: {
            civilization: 'सभ्यता',
            monument: 'अजूबा किस पर आधारित है',
            where: 'कहाँ स्थित है',
            onStage: 'मंच पर',
            drawnOn: 'किन नक्शों पर',
            widest: 'चरम पर',
        },
        maps: { one: 'नक्शा', many: 'नक्शे' },
        oddHeading: '{odd} अजूबे, जो वहाँ खड़े हैं जहाँ उनकी सभ्यता कभी नहीं थी',
        oddLead:
            'खेल हर अजूबे को किसी मौजूद इमारत पर रखता है, और अधिकतर वह इमारत वहीं है जहाँ सभ्यता थी। ये अपवाद हैं, और एटलस पिन गाड़कर चुप रहने के बजाय हर एक पर यह कहता है। स्मारक अब भी असली है; जो नहीं टिकता वह यह दावा है कि सभ्यता वहाँ थी।',
        backToAtlas: '← एटलस',
        openTheAtlas: 'एटलस खोलें',
        source: 'स्रोत कोड',
        sources: 'सीमाएँ {basemaps} से, स्मारक {wiki} से।',
        disagreement:
            'जहाँ विकी और एटलस किसी अजूबे के स्थान पर असहमत हैं — वरंगियन वाला बोल्गर बनाम ग्नेज़्दोवो, मंगोल वाला अवार्गा बनाम काराकोरम — वहाँ एटलस सभ्यता के अपने पैनल पर बताता है कि उसने क्या चुना और क्यों।',
        otherLanguages: 'अन्य भाषाओं में',
    },

    ja: {
        title: 'Age of Empires II の56文明はどこに、いつあったか',
        heading: 'Age of Empires II の各文明が実際にどこにあり、どれだけ続いたか',
        description:
            'Age of Empires II の56文明それぞれが実際にどこにあったか。象徴が手本にした実在の建物、その建物が立つ都市、そして地図帳がその領域を描く世紀。',
        lead: 'Age of Empires II のどの文明も、実在する建物を手本にした象徴を建てます。この表は、その建物と立つ都市、ゲーム自身の設定が領域に与える年代、地図帳がそれを描く年入りの地図、そして最盛期に占めた面積を並べます。',
        method:
            'この地図帳は西暦{first}年から{last}年までの{maps}枚の年入り地図に切り分けられています。領域は描かれたすべての地図に載ります。全{civs}文明のうち{carried}件は、国境を最も近い年の地図から借りる必要があった箇所で、地図帳はそれを淡く描きます。面積は球面上で測っているため、どの図法で開いても比べられます。',
        columns: {
            civilization: '文明',
            monument: '象徴の手本',
            where: '所在地',
            onStage: '在位',
            drawnOn: '描かれる地図',
            widest: '最盛期',
        },
        maps: { one: '枚', many: '枚' },
        oddHeading: '文明が一度もいなかった場所に立つ象徴 {odd} 件',
        oddLead:
            'ゲームはどの象徴も実在の建物に重ねており、多くの場合その建物は文明があった場所にあります。これはその例外で、地図帳はピンを刺して黙るのではなく、ひとつずつ理由を述べます。建物は実在します。成り立たないのは、文明がそこにいたという話のほうです。',
        backToAtlas: '← 地図帳',
        openTheAtlas: '地図帳を開く',
        source: 'ソースコード',
        sources: '国境は {basemaps}、建造物は {wiki} から。',
        disagreement:
            'ヴァリャーグの象徴をボルガルとするかグニョズドヴォとするか、モンゴルのそれをアヴァルガとするかカラコルムとするか——ウィキと食い違う箇所では、地図帳がどちらを採ったかとその理由を、文明ごとの画面で述べます。',
        otherLanguages: '他の言語で',
    },

    ko: {
        title: 'Age of Empires II 56개 문명이 어디에, 언제 있었는가',
        heading: 'Age of Empires II 각 문명이 실제로 어디에 있었고 얼마나 이어졌는가',
        description:
            'Age of Empires II 56개 문명이 실제로 있었던 곳: 불가사의가 본뜬 실재 건물, 그 건물이 선 도시, 그리고 이 지도가 그 영역을 그리는 세기들.',
        lead: 'Age of Empires II의 모든 문명은 실재하는 건물을 본뜬 불가사의를 세웁니다. 이 표는 그 건물과 건물이 선 도시, 게임 자체의 설정이 영역에 부여한 연대, 지도가 그것을 그리는 연도별 지도, 그리고 전성기에 차지한 넓이를 담습니다.',
        method:
            '이 지도는 서기 {first}년부터 {last}년까지 {maps}장의 연도별 지도로 잘려 있습니다. 영역은 그려진 모든 지도에 실리며, 여기에는 {civs}개 문명 가운데 국경을 가장 가까운 연도의 지도에서 빌려야 했던 {carried}건이 포함됩니다 — 지도는 그것들을 옅게 그립니다. 넓이는 구면 위에서 재므로 어떤 도법으로 열어도 서로 비교됩니다.',
        columns: {
            civilization: '문명',
            monument: '불가사의가 본뜬 것',
            where: '어디에 있는가',
            onStage: '무대 위',
            drawnOn: '그려지는 지도',
            widest: '전성기',
        },
        maps: { one: '장', many: '장' },
        oddHeading: '자기 문명이 한 번도 없던 곳에 선 불가사의 {odd}개',
        oddLead:
            '게임은 모든 불가사의를 실재하는 건물 위에 올리고, 대개 그 건물은 문명이 있던 곳에 있습니다. 여기 모은 것은 예외이며, 지도는 핀만 꽂고 입을 다무는 대신 하나하나 그 사정을 말합니다. 건물은 여전히 실재합니다. 성립하지 않는 것은 문명이 거기 있었다는 주장입니다.',
        backToAtlas: '← 지도',
        openTheAtlas: '지도 열기',
        source: '소스 코드',
        sources: '국경은 {basemaps}, 기념물은 {wiki}에서.',
        disagreement:
            '불가사의의 위치를 두고 위키와 지도가 갈리는 곳 — 바랑기아의 것은 볼가르냐 그네즈도보냐, 몽골의 것은 아바르가냐 카라코룸이냐 — 에서는 지도가 무엇을 골랐고 왜인지를 문명별 화면에서 밝힙니다.',
        otherLanguages: '다른 언어로',
    },

    ms: {
        title: 'Di mana 56 tamadun Age of Empires II berada, dan bila',
        heading: 'Di mana setiap tamadun Age of Empires II benar-benar berada, dan berapa lama',
        description:
            'Di mana sebenarnya setiap satu daripada 56 tamadun Age of Empires II berada: monumen sebenar yang menjadi model Keajaibannya, bandar tempat monumen itu berdiri, dan abad-abad yang atlas ini lukiskan wilayahnya.',
        lead: 'Setiap tamadun dalam Age of Empires II membina Keajaiban yang dimodelkan daripada bangunan yang wujud. Jadual ini menamakan bangunan itu dan bandarnya, tahun-tahun yang diberikan oleh cerita permainan kepada wilayah itu, peta bertarikh yang atlas lukiskan wilayahnya, dan berapa luas tanah yang dipegangnya pada kemuncak.',
        method:
            'Atlas ini dipotong kepada {maps} peta bertarikh antara tahun {first} dan {last} Masihi. Sesebuah wilayah disenaraikan pada setiap peta tempat ia dilukis, termasuk {carried} kes daripada {civs} tamadun yang sempadannya terpaksa dipinjam daripada abad terdekat yang dipetakan — atlas melukisnya samar. Luas diukur pada glob, jadi ia setanding dalam apa jua unjuran.',
        columns: {
            civilization: 'Tamadun',
            monument: 'Keajaiban dimodelkan daripada',
            where: 'Di mana ia berdiri',
            onStage: 'Di pentas',
            drawnOn: 'Dilukis pada',
            widest: 'Pada kemuncak',
        },
        maps: { one: 'peta', many: 'peta' },
        oddHeading: '{odd} Keajaiban yang berdiri di tempat tamadunnya tidak pernah berada',
        oddLead:
            'Permainan meletakkan setiap Keajaiban pada bangunan yang wujud, dan bagi kebanyakannya bangunan itu berada di tempat tamadun itu berada. Ini pengecualiannya, dan atlas menyatakannya pada setiap satu dan bukan sekadar menancapkan pin lalu diam. Monumen itu tetap nyata; yang tidak bertahan ialah dakwaan bahawa tamadun itu pernah di situ.',
        backToAtlas: '← Atlas',
        openTheAtlas: 'Buka atlas',
        source: 'Kod sumber',
        sources: 'Sempadan daripada {basemaps}, monumen daripada {wiki}.',
        disagreement:
            'Di mana wiki dan atlas berbeza tentang letak sesebuah Keajaiban — milik Varangia di Bolghar berbanding Gnezdovo, milik Mongol di Avarga berbanding Karakorum — atlas menyatakan pilihannya dan sebabnya pada panel tamadun itu sendiri.',
        otherLanguages: 'Dalam bahasa lain',
    },

    vi: {
        title: '56 nền văn minh Age of Empires II ở đâu, và khi nào',
        heading: 'Mỗi nền văn minh Age of Empires II thực sự ở đâu, và trong bao lâu',
        description:
            'Nơi từng nền văn minh trong 56 nền văn minh của Age of Empires II thực sự tọa lạc: công trình có thật mà Kỳ quan của họ lấy làm mẫu, thành phố nơi công trình ấy đứng, và những thế kỷ mà bản đồ vẽ lãnh thổ của họ.',
        lead: 'Mọi nền văn minh trong Age of Empires II đều dựng một Kỳ quan lấy mẫu từ một công trình có thật. Bảng này nêu công trình ấy và thành phố nơi nó đứng, những năm mà chính cốt truyện của trò chơi dành cho lãnh thổ, các bản đồ có niên đại mà atlas vẽ nó, và bao nhiêu đất họ giữ lúc rộng nhất.',
        method:
            'Atlas được cắt thành {maps} bản đồ có niên đại, từ năm {first} đến năm {last} sau Công nguyên. Một lãnh thổ có mặt trên mọi bản đồ mà nó được vẽ, kể cả {carried} trường hợp trong số {civs} nền văn minh mà đường biên phải mượn từ thế kỷ được lập bản đồ gần nhất — atlas vẽ những trường hợp ấy nhạt hơn. Diện tích đo trên mặt cầu, nên so sánh được ở bất kỳ phép chiếu nào.',
        columns: {
            civilization: 'Nền văn minh',
            monument: 'Kỳ quan lấy mẫu từ',
            where: 'Nơi nó đứng',
            onStage: 'Trên sân khấu',
            drawnOn: 'Được vẽ trên',
            widest: 'Lúc rộng nhất',
        },
        maps: { one: 'bản đồ', many: 'bản đồ' },
        oddHeading: '{odd} Kỳ quan đứng ở nơi nền văn minh của chúng chưa từng đặt chân',
        oddLead:
            'Trò chơi đặt mỗi Kỳ quan lên một công trình có thật, và phần lớn công trình ấy nằm đúng nơi nền văn minh từng ở. Đây là những ngoại lệ, và atlas nói rõ ở từng trường hợp thay vì cắm ghim rồi im lặng. Công trình vẫn có thật; điều không đứng vững là tuyên bố rằng nền văn minh đã ở đó.',
        backToAtlas: '← Atlas',
        openTheAtlas: 'Mở atlas',
        source: 'Mã nguồn',
        sources: 'Đường biên từ {basemaps}, công trình từ {wiki}.',
        disagreement:
            'Ở những chỗ wiki và atlas bất đồng về vị trí một Kỳ quan — của người Varangia ở Bolghar hay Gnezdovo, của người Mông Cổ ở Avarga hay Karakorum — atlas nói rõ đã chọn cái nào và vì sao, ngay trên bảng của nền văn minh đó.',
        otherLanguages: 'Bằng ngôn ngữ khác',
    },

    'zh-CN': {
        title: 'Age of Empires II 的 56 个文明身处何地、始于何时',
        heading: 'Age of Empires II 每个文明究竟身处何地，又延续多久',
        description:
            'Age of Empires II 的 56 个文明各自真正所在之处：其奇观所仿的真实建筑、该建筑所在的城市，以及本图集绘出其疆域的那些世纪。',
        lead: 'Age of Empires II 中每个文明都会建造一座奇观，仿自一处真实存在的建筑。本表列出该建筑及其所在城市、游戏设定给予该疆域的年代、图集绘制它的纪年地图，以及它鼎盛时所据的面积。',
        method:
            '本图集切分为公元 {first} 年至 {last} 年之间的 {maps} 幅纪年地图。一处疆域会出现在每一幅绘有它的地图上，其中包括 {civs} 个文明中的 {carried} 例：边界不得不借自最近的已测绘世纪，图集将其画得更淡。面积在球面上量得，因此无论以何种投影打开都可比较。',
        columns: {
            civilization: '文明',
            monument: '奇观仿自',
            where: '所在之处',
            onStage: '在位年代',
            drawnOn: '绘于',
            widest: '鼎盛时',
        },
        maps: { one: '幅', many: '幅' },
        oddHeading: '{odd} 座奇观，立于其文明从未到过之地',
        oddLead:
            '游戏把每座奇观都安放在一处真实存在的建筑上，多数情况下这处建筑正位于该文明所在之地。以下是例外，图集在每一处都把话说清，而不是插下图钉便沉默。建筑依然真实；站不住的是“文明曾在此地”这一说法。',
        backToAtlas: '← 图集',
        openTheAtlas: '打开图集',
        source: '源代码',
        sources: '边界来自 {basemaps}，建筑来自 {wiki}。',
        disagreement:
            '在维基与图集对奇观所在地有分歧之处——瓦良格的在保加尔还是格涅兹多沃，蒙古的在阿瓦尔加还是哈拉和林——图集会在该文明自己的面板上说明选了哪一个，以及为什么。',
        otherLanguages: '其他语言',
    },

    'zh-TW': {
        title: 'Age of Empires II 的 56 個文明身處何地、始於何時',
        heading: 'Age of Empires II 每個文明究竟身處何地，又延續多久',
        description:
            'Age of Empires II 的 56 個文明各自真正所在之處：其奇觀所仿的真實建築、該建築所在的城市，以及本圖集繪出其疆域的那些世紀。',
        lead: 'Age of Empires II 中每個文明都會建造一座奇觀，仿自一處真實存在的建築。本表列出該建築及其所在城市、遊戲設定給予該疆域的年代、圖集繪製它的紀年地圖，以及它鼎盛時所據的面積。',
        method:
            '本圖集切分為西元 {first} 年至 {last} 年之間的 {maps} 幅紀年地圖。一處疆域會出現在每一幅繪有它的地圖上，其中包括 {civs} 個文明中的 {carried} 例：邊界不得不借自最近的已測繪世紀，圖集將其畫得更淡。面積在球面上量得，因此無論以何種投影打開都可比較。',
        columns: {
            civilization: '文明',
            monument: '奇觀仿自',
            where: '所在之處',
            onStage: '在位年代',
            drawnOn: '繪於',
            widest: '鼎盛時',
        },
        maps: { one: '幅', many: '幅' },
        oddHeading: '{odd} 座奇觀，立於其文明從未到過之地',
        oddLead:
            '遊戲把每座奇觀都安放在一處真實存在的建築上，多數情況下這處建築正位於該文明所在之地。以下是例外，圖集在每一處都把話說清，而不是插下圖釘便沉默。建築依然真實；站不住的是「文明曾在此地」這一說法。',
        backToAtlas: '← 圖集',
        openTheAtlas: '開啟圖集',
        source: '原始碼',
        sources: '邊界來自 {basemaps}，建築來自 {wiki}。',
        disagreement:
            '在維基與圖集對奇觀所在地有分歧之處——瓦良格的在保加爾還是格涅茲多沃，蒙古的在阿瓦爾加還是哈拉和林——圖集會在該文明自己的面板上說明選了哪一個，以及為什麼。',
        otherLanguages: '其他語言',
    },
};

/**
 * Fills the placeholders a sentence carries.
 *
 * @param said - The sentence, with `{name}` where a number goes.
 * @param values - What each name stands for.
 * @returns The sentence with every placeholder replaced.
 */
export function fill(said: string, values: Readonly<Record<string, string | number>>): string {
    return said.replace(/\{(\w+)\}/g, (whole, name: string) => String(values[name] ?? whole));
}

/** Every language the page is written in, English first because the others hang off it. */
export const PAGE_LOCALES = SUPPORTED_LOCALES;
