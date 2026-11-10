# Takt — planejador de hábitos para e-ink

Aplicativo de página única, local e offline, para tablets e-ink de 6". Cartões
grandes sem rolagem, marcação com um toque, atrasados continuam visíveis até
serem fechados. Sem rede, sem contas, sem análise: os dados ficam no navegador
do aparelho.

**Ao vivo:** https://danilka88.github.io/eink-planner/

![Painel](design/screens/eink-536-day.png)

## O que faz

- **Painel do dia.** 1–4 colunas, os cartões ocupam a tela e são legíveis a 1–2 m.
- **Hábito na sua janela.** Aparece às `06:30`, depois das `09:30` vira
  «atrasado · até 09:30» e fica até ser marcado (pode ser desligado).
- **Um toque** — feito: o cartão inverte e some em 5–60 minutos.
- **Repetição:** todo dia, dias da semana, dia do mês, data única.
- **Histórico e arquivo.** Todas as marcações por dia, desfazer e restaurar;
  hábitos desativados mantêm o histórico.
- **Duplicar** um hábito com um toque.
- **Atrasados** de dias anteriores, fechados retroativamente.
- **8 idiomas**, tema claro/escuro/auto, exportação e importação JSON.
- **Offline:** service worker, manifesto PWA, zero requisições de rede.

## Início rápido

```bash
git clone https://github.com/Danilka88/eink-planner.git
cd eink-planner
python3 -m http.server 8080
```

Abra `http://127.0.0.1:8080`.

> Abrir `index.html` com duplo clique não funciona: o app usa módulos ES e o
> navegador os bloqueia em `file://`.

### Instalar no tablet

1. Abra o site por **https** (ou `localhost`) — o cache offline só funciona aí.
2. Menu do navegador → «Adicionar à tela inicial».
3. Ative o modo avião e abra o atalho: funciona sem rede.

O `http://192.168.x.x` comum não tem modo offline — restrição do navegador, não
falha do app. Ajustes → Sobre mostra o estado atual.

## Controles

| Ação | O que faz |
|---|---|
| Tocar no cartão | marcar / desmarcar |
| Toque longo | editor do hábito |
| Toque longo em atrasado | registrar pulo |
| «Todos» → «Hábitos» | ativar, duplicar, editar, adicionar |
| «Todos» → «Histórico» | marcas por dia: remover, marcar, pular |
| «Todos» → «Arquivo» | restaurar ou apagar de vez |
| «Atualizar» | flash na tela (limpeza de fantasmas) |
| «Ajustes» | tema, idioma, formato de hora, timers, demo, exportar |

## Estrutura

```
index.html            marcação, SEO, modelos, CSP
styles.css            tema 1 bit, grade, regras e-ink
js/app.js             DOM, eventos, render, editor, ajustes
js/core/schedule.js   janelas, repetição, atrasos (puro)
js/core/state.js      modelo, migrações, localStorage
js/core/i18n.js       8 idiomas, plurais Intl, datas, 12/24 h
js/core/dict/*.js     dicionários da interface
js/core/icons.js      sprite Phosphor Bold
sw.js                 cache offline
tests/                testes unitários (node --test)
docs/                 arquitetura, modelo de dados, i18n, deploy
```

## Testes

```bash
npm test
```

25 testes: horário, migrações, plurais nos 8 idiomas, formato de hora.
Veja `docs/TESTING.md`.

## Privacidade

Nenhuma requisição de rede: `connect-src 'self'` na CSP as bloqueia no
navegador, e o app não faz nenhuma. Os dados ficam no `localStorage` e não saem
do aparelho. Veja `PRIVACY.md`.

## Dados

- Tudo fica no `localStorage` do navegador do aparelho. Não há sincronização.
- **«Compartilhar»** abre o menu do Android: o arquivo vai direto para o Telegram, e-mail ou Arquivos.
- **«Exportar para arquivo»** baixa `takt-YYYY-MM-DD.json`.
- **«Importar de arquivo»** substitui tudo após confirmar.
- Limpar os dados do site apaga os hábitos: exportar é a única rede de segurança.
- Endereço = armazenamento. Ao trocar de endereço, mova os dados com exportar e importar.

## Licença

Código — MIT (`LICENSE`). Ícones — Phosphor Icons, MIT (`THIRD-PARTY.md`).

## Outros idiomas

[Русский](README.md) · [English](README.en.md) · [Español](README.es.md) ·
[Français](README.fr.md) · [中文](README.zh.md) · [हिन्दी](README.hi.md) ·
[العربية](README.ar.md)
