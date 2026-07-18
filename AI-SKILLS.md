# План прокачки AI-компетенций (июль 2026)

Составлен на основе анализа проектов Alex16111977. Главный фокус — **BASERP25_INDUSTRIALBUD**
(конфигурация BAS ERP с уже встроенным MCP-сервером: `mcp_APIBackend`, `mcp_Выполнение`,
`mcp_Метаданные`, обработки `mcp_Инструмент*`). Дополнительно: образовательные сайты
(jane-school, deutschweg, lingua и др.), notebooklm-mcp-fork, интеграции 1С (medoc, Zebra).

Цели: **встроить AI в ERP** · **интеграции через MCP** · **быстрее разрабатывать с AI**.

---

## 1. Бесплатные курсы с сертификатами — Anthropic Academy

Все курсы бесплатны, выдают сертификат. Порядок — от важного к желательному:

| Курс | Зачем именно вам |
|---|---|
| [Anthropic Academy (anthropic.skilljar.com)](https://anthropic.skilljar.com/) | Каталог всех 17 курсов |
| Building with the Claude API | База для встраивания AI в ERP: tool use, streaming, кэширование |
| Introduction to Model Context Protocol | Формализует то, что вы уже делаете с mcp_* в 1С |
| [Introduction to Agent Skills](https://anthropic.skilljar.com/introduction-to-agent-skills) | Упаковка вашей экспертизы по BAS ERP в переиспользуемые навыки |
| Claude Code in Action | Субагенты, hooks, plan mode — ускорение разработки конфигурации |
| [anthropics/courses (GitHub)](https://github.com/anthropics/courses) | Практические ноутбуки: prompt engineering, evaluations, tool use |
| [anthropic.com/learn](https://www.anthropic.com/learn) | Общий портал учебных материалов |

## 2. Ключевые статьи (инженерный блог Anthropic)

Приоритет №1 для вашего уровня — вы уже строите инструменты для агентов:

1. [Writing effective tools for AI agents](https://www.anthropic.com/engineering/writing-tools-for-agents) —
   как проектировать MCP-инструменты: нейминг, описания, «prototype → evaluate → collaborate».
   Прямо применимо к вашим `mcp_ИнструментВыполнениеЗапросов`, `mcp_ИнструментУправлениеДокументами`.
2. [Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) —
   как сократить расход контекста, когда у агента много инструментов (у вас их будет много).
3. [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) —
   управление контекстом: критично при работе с конфигурацией на 94 000 файлов.
4. [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) —
   навыки как папки со знаниями (SKILL.md): кандидат — «навык BSL/BAS ERP» для Claude Code.
5. [Building agents with the Claude Agent SDK](https://claude.com/blog/building-agents-with-the-claude-agent-sdk) —
   автономные агенты вне IDE: фоновая обработка обменов, документов, задач ERP.
6. [Claude Code best practices](https://code.claude.com/docs/en/best-practices) —
   официальные практики: CLAUDE.md, план-режим, субагенты, верификация по доказательствам.
7. [How Claude Code is used in practice](https://www.anthropic.com/research/claude-code-expertise) —
   исследование реальных паттернов использования.
8. [Tutorial: Build a tool-using agent](https://platform.claude.com/docs/en/agents-and-tools/tool-use/build-a-tool-using-agent) —
   пошаговый туториал tool use для Claude API.

## 3. Экосистема MCP + 1С (главное направление)

- [Untru/1c-mcp](https://github.com/Untru/1c-mcp) — **каталог всех MCP-серверов для 1С**; следить за ним постоянно.
- [vladimir-kharin/1c_mcp](https://github.com/vladimir-kharin/1c_mcp) — MCP-сервер как расширение конфигурации
  (архитектурно ближе всего к вашей реализации mcp_* — сравнить подходы).
- [feenlace/mcp-1c](https://github.com/feenlace/mcp-1c) — один бинарник, 10 инструментов: AI видит метаданные
  и генерирует точный BSL-код.
- [alkoleft/mcp-bsl-platform-context](https://github.com/alkoleft/mcp-bsl-platform-context) — справка по синтаксису
  и объектной модели 1С прямо в контексте AI-ассистента.
- [ROCTUP/1c-mcp-toolkit](https://github.com/ROCTUP/1c-mcp-toolkit) — MCP + REST API для метаданных и данных 1С.
- [hawkxtreme/mini-ai-1c](https://github.com/hawkxtreme/mini-ai-1c) — AI-ассистент для разработчиков 1С,
  интеграция с Конфигуратором.

## 4. AI внутри ERP: RAG и text-to-query

- [State of RAG 2026 (Squirro)](https://squirro.com/squirro-blog/state-of-rag-genai) — GraphRAG, guardrails, ROI.
- [Document Intelligence: Building RAG brick by brick (Towards Data Science)](https://towardsdatascience.com/document-intelligence-a-series-on-building-rag-brick-by-brick-from-minimal-to-corpus-scale/) —
  серия о RAG по документам от минимального до корпоративного масштаба.
- [Text-to-SQL comparison 2026 (Promethium)](https://promethium.ai/guides/text-to-sql-comparison-2026-enterprise-solutions/) —
  что реально работает: семантический слой поверх схемы = аналог вашего запросника в 1С.
- [Agentic AI ERP systems (AIMultiple)](https://aimultiple.com/agentic-ai-erp) — как вендоры ERP встраивают агентов.

## 5. Навыки, которые стоит развить (по приоритету)

1. **Проектирование инструментов для агентов** — описания, нейминг, границы ответственности,
   пагинация/лимиты ответов. Применить к существующим mcp_* инструментам.
2. **Evals** — набор тестовых задач для ERP-инструментов («проведи документ», «найди дисбаланс»),
   измерение качества до/после изменений. Без evals улучшения вслепую.
3. **Context engineering** — что и когда класть в контекст агента при работе с огромной конфигурацией.
4. **Agent Skills** — упаковать правила BAS ERP (план счетов, регистры, проведение) в SKILL.md.
5. **Claude Agent SDK** — фоновые агенты: разбор входящих документов, сверка обменов medoc/1С.
6. **RAG + text-to-query с учётом ролей** — чат по данным ERP с соблюдением прав доступа 1С.
7. **Безопасность агентов** — ограничение `mcp_ИнструментВыполнениеЗапросов` (только чтение,
   белые списки объектов), аудит действий агента в ERP.

## 6. Практический план на 6 недель

- **Нед. 1–2**: курсы «Building with the Claude API» + «Intro to MCP»; статья Writing effective tools;
  аудит своих mcp_* инструментов по её чек-листу.
- **Нед. 3–4**: собрать eval-набор из 20–30 реальных задач к ERP; переписать описания инструментов,
  замерить разницу; добавить guardrails на выполнение запросов.
- **Нед. 5–6**: прототип AI-фичи в ERP (например, AI-обработка неизвестного партнёра или чат по
  остаткам/взаиморасчётам); создать SKILL.md «BAS ERP» для Claude Code; изучить Agent SDK.
