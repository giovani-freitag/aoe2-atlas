<p align="center">
  <img src="public/brand.svg" alt="" width="104">
</p>

<h1 align="center">AoE2 Atlas</h1>

<p align="center">
  <strong>Um atlas interativo das 56 civilizações de <em>Age of Empires II</em>.</strong><br>
  A maravilha de cada uma plantada sobre o monumento real que a inspirou, e a fronteira que ela
  tinha <strong>em cada século</strong>, desenhada em escala honesta.
</p>

<p align="center">
  <a href="https://github.com/giovani-freitag/aoe2-atlas/actions/workflows/ci.yml"><img src="https://github.com/giovani-freitag/aoe2-atlas/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/license-GPL--3.0-C8A44A?style=flat-square&labelColor=1A1815" alt="GPL-3.0-or-later">
  &nbsp;·&nbsp;
  <img src="https://img.shields.io/badge/React-19-C8A44A?style=flat-square&logo=react&logoColor=white&labelColor=1A1815" alt="React 19">
  <img src="https://img.shields.io/badge/Vite-8-C8A44A?style=flat-square&logo=vite&logoColor=white&labelColor=1A1815" alt="Vite 8">
  <img src="https://img.shields.io/badge/TypeScript-strict-C8A44A?style=flat-square&logo=typescript&logoColor=white&labelColor=1A1815" alt="TypeScript strict">
  <img src="https://img.shields.io/badge/i18n-17%20idiomas-C8A44A?style=flat-square&logo=i18next&logoColor=white&labelColor=1A1815" alt="Dezessete idiomas">
</p>

<p align="center">
  <a href="https://giovani-freitag.github.io/aoe2-atlas/"><strong>Abrir o atlas →</strong></a>
</p>

<p align="center">
  <img src="docs/century.png" alt="O mundo de 1200, com as 34 civilizações que existiam nele" width="860">
</p>

---

## As quatro coisas que este atlas leva a sério

### O eixo é o tempo, não o auge

A primeira versão desenhava um recorte único por civilização — a maior extensão que cada uma
alcançou — e comparava todos na mesma tela. Isso produz afirmações falsas: ela relatava que
mongóis e persas dividiam 90% do território, sendo que o recorte persa era de 600 e o mongol de
1279. Setecentos anos de distância. Não é disputa, é coincidência geográfica.

A convenção da cartografia histórica ([Euratlas](https://www.euratlas.net/history/europe/index.html)
e afins) é **sequência de fatias temporais**, um mapa por período, e nunca sobrepor entidades de
épocas diferentes. É o que este atlas faz agora: você escolhe um ano na trilha e vê quem existia
e com que extensão **naquele ano**. São 19 fatias entre 200 e 1600.

Em 1200 são 34 civilizações no mapa. Em 800, 21. Os astecas não aparecem antes de 1325 e os
chineses somem entre 1279 e 1400 — porque era o Yuan mongol.

Duas fronteiras só se cruzam na tela se as duas existiam no mesmo século. Isso é garantido pela
arquitetura, não por um filtro que alguém precisa lembrar de aplicar, e um teste recusa qualquer
par anacrônico.

### A projeção é escolha sua, e a distorção é dita em voz alta

Equal Earth por padrão, porque em Mercator a Escandinávia parece maior que a Índia. Mas dá para
trocar por Natural Earth ou Mercator nos ajustes — **e nenhum número muda**: as áreas são medidas
na esfera quando os dados são gerados, não lidas do desenho. O que a troca muda é o desenho, e
aí o mapa avisa: numa projeção que não preserva área, a nota diz quanto o que está na tela está
inflado na latitude que você está olhando. O fator é medido, não deduzido — um quadrado pequeno é
projetado ali e no equador, e as duas razões são comparadas, então vale para qualquer projeção.

E fronteira medieval era zona, não linha. A fonte informa o quanto conhece cada traçado, e o
atlas obedece: contorno **sólido** onde a fronteira é demarcada, **tracejado e desfocado** onde é
aproximada, e **tracejado claro** quando a linha teve que ser emprestada de outro século — com o
painel dizendo de qual e a quantos anos de distância.

Onde dois domínios contemporâneos se sobrepõem, as hachuras se cruzam e você vê as duas cores no
mesmo quilômetro quadrado, sem o atlas calcular uma interseção sequer em tempo de execução.

### Mobile-first é literal

A folha base é escrita para 360px e **não tem uma media query sequer**. O desktop é adição, só
com `min-width`. O mapa ocupa a tela inteira e nunca é espremido; lista, ficha e filtros chegam
como offcanvas por cima — `<dialog>` para o que precisa prender o foco, Popover API para o que
não precisa, `@starting-style` e `allow-discrete` para as transições, container queries para os
mesmos componentes servirem gaveta no celular e coluna no desktop.

<img src="docs/phone.png" alt="A gaveta de civilizações num celular de 360px" width="320">

### Fala as 17 línguas em que o jogo é vendido

en · pt-BR · es · es-MX · fr · de · it · pl · ru · tr · hi · ja · ko · ms · vi · zh-CN · zh-TW.

Não é a interface traduzida com os dados em inglês por baixo: **os 56 nomes de civilização, os
56 monumentos, as cidades, os países e o nome de cada domínio** existem nas dezessete. Os
registros em `src/data/civilizations.ts` não têm uma palavra de idioma nenhum — só chave,
coordenada e anos —, e tudo o que se diz sobre uma civilização vem de `src/i18n/locales/<tag>/`.

Número e data seguem junto: 8,45,077 km² em híndi, 845.077 km² em português, 1999/09/30 em
japonês. A busca casa contra o idioma na tela (procurar "モンゴル" acha os mongóis) e a ordenação
alfabética usa a colação da língua, não uma fixa. Cada idioma é um chunk próprio de ~12 kB,
buscado só quando escolhido; a detecção lê o navegador e cai no inglês quando não reconhece.

Cinzel é uma capital romana e não sabe cirílico, devanágari, hangul nem kana — e nem sequer o
alfabeto latino inteiro: os acentos empilhados do vietnamita ficam de fora dos dois subconjuntos
que a família publica. Onde ela não serve, o título cede lugar a uma serifada do sistema, porque
uma fonte que cobre metade da palavra é pior que uma que não cobre nada.

## Rodando

```bash
npm install
npm run dev        # http://localhost:5174
```

| Comando | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | `tsc -b` + build de produção (Vite 8 / Rolldown) |
| `npm run lint` | ESLint com checagem de tipos |
| `npm test` | Vitest |
| `npm run data:build` | regera as 19 fatias temporais |
| `npm run data:icons` | baixa os três emblemas que o jogo ainda não traz |

## De onde vêm os dados

| O quê | Fonte | Licença |
| --- | --- | --- |
| Fronteiras históricas | [aourednik/historical-basemaps](https://github.com/aourednik/historical-basemaps) — um GeoJSON do mundo por século | GPL-3.0 |
| Costa | Natural Earth 50m, via [world-atlas](https://github.com/topojson/world-atlas) | domínio público |
| Maravilhas e monumentos | [Age of Empires Series Wiki](https://ageofempires.fandom.com/wiki/Wonder_(Age_of_Empires_II)) | CC-BY-SA |
| Emblemas | 53 extraídos do jogo instalado; Dinamarqueses, Saxões e Varegues da wiki, porque a DLC só sai em 22/09/2026 | Microsoft / World's Edge |

`npm run data:build` baixa os arquivos de ano para `.cache/` (não versionado), recorta a
fronteira de cada civilização em cada século, simplifica, mede a área na esfera e calcula as
fronteiras entre contemporâneos. Sai um índice pequeno em `src/data/generated` (sempre carregado)
e 19 fatias de ~30 kB em `public/data`, buscadas sob demanda — meio megabyte de geometria num
bundle só não é coisa que se peça a um celular para ver um século.

### O modelo de aliases

`src/data/territory-sources.ts` descreve cada civilização pelo **conjunto de nomes que o reino
usa ao longo dos séculos** — Franks, depois Frankish Kingdom, depois Carolingian Empire — e o
builder resolve quais existem em cada fatia. Os anos desenhados são limitados pelo período em
`civilizations.ts`: "Kingdom of France" casa em 1600, mas os francos acabam em 987, então nada é
recortado lá.

Seis reinos a fonte não traz e foram desenhados à mão, grosseiros de propósito e com o motivo
escrito ao lado: os três Reinos Combatentes, a dinastia Jin dos jurchéns, a Boêmia e o estado
borgonhês dos Valois. O painel sempre diz qual dos caminhos produziu o contorno na tela.

### As assertivas que quebram o build

A versão anterior enviou **dez maravilhas fora do próprio território** — o templo de Somnath 248
km além dos gurjares, entre outras. O build agora recusa isso: toda maravilha precisa estar
dentro de alguma fatia da própria civilização, com 12 km de tolerância para monumentos costeiros
que a simplificação da costa deixa de fora.

Recortar por século resolveu oito dos dez sozinho. Os dois que sobram estão na lista de exceções,
com o motivo por escrito: o Arco de Constantino é romano e os hunos nunca chegaram a Roma; o
pogost de Kizhi é do século XVII, na Carélia, fora de qualquer recorte eslavo medieval.

## Tema

Tema único e acabado: **Age** — pergaminho para o mapa e as fichas, couro para os painéis, ferro
para os controles, carvalho para a trilha do tempo, brasas atrás do cabeçalho e Cinzel nos
títulos. O sistema é trocável por `src/skins/`, mas um tema meia-boca é pior que um só.

As oito cores de território são os matizes da paleta de referência **escurecidos até passarem
3:1 contra o pergaminho** — quatro dos originais sumiam sobre papel envelhecido. A atribuição
região→matiz foi buscada entre as 40.320 ordenações possíveis pela que mais separa regiões *que
podem fazer fronteira no mapa*: pior par vizinho ΔE 15,5 em visão normal e 8,7 em daltonismo,
com a hachura carregando a civilização individual. Um teste recusa qualquer tom que perca
contraste contra o pergaminho.

## Como está montado

```
src/
  domain/        entidades e valores, sem framework
  services/      atlas (catálogo e fatias), geo (projeção), palette (cor e hachura)
  data/          catálogo curado + índice gerado
  skins/age/     tokens, materiais e a paleta validada do tema
  i18n/          as 17 línguas, dois bundles cada: ui (interface) e atlas (o mundo)
  react/         componentes, hooks, providers, estilos, efeitos
scripts/         o pipeline que gera a geografia
tests/           unit/ e feature/ — inclusive o que recusa um bundle com chave faltando
public/data/     as 19 fatias, buscadas sob demanda
```

O mapa é SVG puro com [d3-geo](https://github.com/d3/d3-geo): sem tiles, sem chave de API, sem
rede em tempo de execução além das fatias. Zoom e pan movem um único grupo SVG, então os caminhos
projetados são calculados uma vez por tamanho de viewport, não por quadro; os marcadores ficam
fora desse grupo e recebem a transformação na mão, que é o que mantém os escudos do mesmo tamanho
em qualquer zoom.

## Licença

GPL-3.0-or-later. A geografia versionada é derivada de um conjunto de dados GPL-3.0, e o projeto
acompanha.
