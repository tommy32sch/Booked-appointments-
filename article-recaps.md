# Article recaps (living compile)

Purpose: living compile of Tommy's X article RT recaps. Recaps only. Do not treat this as an essay or as source articles.

## KEY FINDINGS

- Build so a bot can run it; Tommy gets a simple check screen (Agent XP).
- Train like a teammate: job → correct + why → save process → test weird case → then clock.
- One job at a time. Draft, never send. Don't put a broken job on a timer.
- Money numbers in these pieces are the author's claims, not checked.
- Tommy is not the closer / not cold-calling.
- Check the trail, write a kill switch before a clock.

## cards

### card

- title: Rethinking skills and prompts for GPT-6 Astra
- author: @pvncher
- date: Fri Sep 4 2026 2:44 PM PT
- url: https://x.com/pvncher/status/2095991462416490862
- also: article https://x.com/pvncher/article/2095990147300851715
- recap: GPT-6 Astra changes how you write agent instructions. Keep skill files short and narrowly triggered — too many skills waste context and hurt selection. Use progressive disclosure with pointers to supporting docs and scripts. Rigid recipes can hinder a model that handles ambiguity well. Repository guidance should support multiple models. AGENTS.md should route to the right docs, not require everything up front. Blanket testing instructions cause unnecessary work. Permit safe, bounded local workflows. Define boundaries and completion criteria early, including implementation, inspection, fixes, and reruns. Audit old guidance and build what older models made impractical. Grok Bot / Grok / Cursor quiet in this piece.
- apply: audit and shorten skill descriptions; route AGENTS.md by task; add explicit completion criteria; rerun affected safe local tests
- skip: inventing a new stack of giant prompts

### card

- title: Grok Bot is sneaky the best way to code with AI
- author: Alex Finn @AlexFinn
- date: Fri Sep 4 2026 11:36 AM PT
- url: https://x.com/AlexFinn/status/2095944004932423216
- note: long-form post with attached workflow image; not an X Article
- recap: Two roles: a developer bot and a project-manager bot. Developer does the coding and spawns Cursor cloud agents. PM watches the developer, keeps it on track, and grants permission when needed. Board in Notion or Linear (he says both have free Grok Bot plugins). Ordered tasks go to the developer; it turns them into pull requests you can test and merge. He calls it a software-factory loop. He claims about 90% of his AI coding moved to this workflow — that share is his claim, not checked. Grok Bot and Cursor cloud agents are named throughout.
- apply: board + ordered tasks; developer agent opens one PR per task via Cursor cloud agents; PM agent monitors order and permissions
- skip: merge and final engineering judgment stay human-only; choose the project and authorize access yourself

### card

- title: The AI Personal Brand Playbook
- author: Mubbu @wizofecom
- date: Thu Sep 3 2026 6:02 AM PT
- url: https://x.com/wizofecom/status/2095497646408376464
- note: short intro + two-image carousel (not an X Article); captain reposted
- recap: Become recognized in any niche with about 45–90 minutes a week. Central model is micro-authority: content + distribution + strategy. Content should sound human — AI can draft skeleton/topics/research; you add detail and voice. 1–3 useful posts a day is enough. Distribution is interest-graph work: join the right conversations and keywords, not begging for engagement. Strategy means every post has a purpose and a weekly loop on saves, replies, hooks, and formats. Pick archetype and ICP before writing. Aim to be the obvious choice inside one industry, not go viral. Claims about running 60+ brands and revenue ranges are the author’s claims, not checked. Grok Bot / Grok / Cursor quiet in this piece.
- apply: ICP/archetype brief + keyword inventory before drafts; weekly analytics report by hook/format; LLM skeleton then human voice and approve before post
- skip: posting volume for its own sake; going on camera if the playbook says you skip it

### card

- title: A non-technical designer with no audience just crossed 21 AI agent setups in 6 months
- author: Corey Ganim @coreyganim
- date: Tue Sep 2 2026 9:11 AM PT
- url: https://x.com/coreyganim/status/2095182718426567164
- note: multi-post X thread (not an X Article); captain reposted
- recap: Non-technical designer, no audience, 21 AI-agent setups in six months via referrals only. Product is managed coaching/service, not the agent stack — sell “it works and I handle it.” One-text pilot pitch; first client $250/month. Setup fees moved $500 → $1,000; targeting $2,000 setup + $1,000/month per agent (“the market tells you your price by not saying no”). Delivery in a Telegram group with operator + client + agent. Workflow example: invoice email → PDF into Excel → Dropbox → send link. Google Sheets as client-facing source of truth. Zero outbound; free early work powered referrals. Uptime is the product; named platform Orgo. Make value visible — one client’s first week: 63 hours saved, $6,300. Those dollars and hours are the author’s claims, not checked. Grok Bot / Grok / Cursor quiet in this piece.
- apply: one-text pilot pitch; hours/$ saved weekly report; per-client runbooks + uptime checks
- skip: pricing, first pilot, shared group, and client-data consent stay human-only

### card

- title: $2400/yr vs ~$10/mo
- author: @hooeem
- date: Mon Aug 24 2026 1:18 PM PT
- url: https://x.com/hooeem/status/2091983617991782555
- recap: He compares Grok Bot at about $2400 a year to about $10 a month. Those prices are his claims, not checked. Don't pay Bot rates for a dumb always-on chore.
- apply: human-approval on refunds/sends; don’t pay Bot rates for a dumb always-on chore

### card

- title: Grok Bot usage
- author: @BlackWolfNews
- date: Mon Aug 24 2026 1:01 PM PT
- url: https://x.com/BlackWolfNews/status/2091979268427592137
- recap: Short single-goal jobs. Batch in slices. Put a cap on loops. Kill always-on. Extra Usage costs more than the included pool.
- apply: short single-goal jobs, batch slices, loop caps, kill always-on, Extra Usage costs more than the included pool

### card

- title: How Grok Bot Automated Our Sales Desk and Our Accounting
- author: @0x_Anni
- date: Mon Aug 24 2026 1:00 PM PT
- url: https://x.com/0x_Anni/status/2091978958200053982
- recap: One Chief, two desks, seven specialists.
- apply: timestamp field first, two-week baseline, credit/aging human stops

### card

- title: How to make money with Grok Bot
- author: @EXM7777
- date: Mon Aug 24 2026 8:09 AM PT
- url: https://x.com/EXM7777/status/2091905664704745583
- recap: Captain already RT’d this. One bot per workflow. Start zero-risk.
- apply: one bot per workflow; start zero-risk

### card

- title: My Grok Bot Just Paid Its Own Salary
- author: Rahul @sairahul1
- date: ~Mon Aug 24 2026
- url: https://x.com/sairahul1/status/2091831460055671085
- recap: He gave the bot one job: publish one SEO tool page a day. Most people use Grok Bot for email and flights. He points it at money: nine systems (tools, local list, books, affiliate pages, newsletter, Facebook, X, Pinterest, YouTube). He prints big Pinterest and YouTube numbers. Those are his claims. Not checked. Same rule on every bot: draft, never send. Research, never publish until you look. Don't do the irreversible step.
- steal: one job, daily run, draft never send
- skip: standing up all nine systems

### card

- title: quote of Ronin's side-hustle guide
- author: EP @eptwts
- date: Aug 23 2026 afternoon
- url: https://x.com/eptwts/status/2091621484032614503
- recap: Claim: EP made $100k in 10 months as a shadow growth operator (find a skilled creator with no audience, build the offer and posts, take a cut, stay off camera). Those dollars are Ronin's story, not a receipt. Method: bot shortlists thin-niche creators; prompt writes posts that sell the offer; command-line checkout for plans/links/stats; never delete products, change prices, or move money without a yes.
- steal: which content sells the offer
- skip: productizing someone else's skill / being the closer

### card

- title: Grok Bot Agents: from scratch to automating your life in 10 Steps (Full Guide)
- author: 0xRafy @0xRafy
- date: Aug 23 2026 11:39 AM
- url: https://x.com/0xRafy/status/2091596328128106892
- also: longer article https://x.com/0xRafy/status/2090077067509370983 (Aug 19)
- recap: People fail on day three, not day one. They hand over too much on day two with no way to judge trust. Ten steps by autonomy. (1) Pick the task first: frequent, reversible, 30-second check. No money/contracts/clients yet. (2) Install, then ask it to describe, not do. Killer question: what would you be unsure about? (3) Operating manual not a prompt: job, done-looks-like, ambiguity, stop-and-ask not use-your-best-judgment, plus three real examples. (4) One key not the keyring; for other sites the bot opens login and Tommy types the password on the computer, never in chat. (5) Watch the first full run, log every guess. (6) Teach multi-step by demo. (7) Cut the leash once, then audit the trail vs the summary. (8) Schedule with ceilings on volume and spend. (9) Second bot when you keep correcting context. (10) Build undo first: pause-all, weekly 15-min review, kill criterion written while calm. Close: trust is accumulated. Slower for a week, then permanently faster. He also quoted an Elon clip about Grok Bot — that quote is his, not verified by us.
- steal: audit the trail not the summary; write a kill/ceiling before you schedule
- skip: Substack plug

### card

- title: How to actually train Grok Bot
- author: Liam Fallen @liam_fallen
- date: Aug 23 2026
- url: https://x.com/liam_fallen/status/2091439459317264424
- recap: Stop stuffing a giant prompt before it has done a job. Give it real work. Fix the output in chat. Say why. Show the job once on the computer (or say save what we just did). That becomes a saved process. Test a weird case. Draft don't send. Only then a clock. If it fails by hand, a timer is a faster mistake. Order: job → correction → save → test → clock. Training never finishes.
- steal: coach the crew that way
- skip: more giant prompts

### card

- title: Grokbot 101
- author: EP @eptwts
- date: Sat Aug 22 2026 morning
- url: no URL on file
- recap: No prices. Grok Bot lives on a computer in the cloud that's already running. Keeps going when the phone is off. Watch the screen and take over the browser. Not a coding-agent replacement. Teach a task once by recording, then schedule or text. Uses he lists: notes library, private dashboard, scheduled X, morning Gmail brief, scrape own stats, niche news pile, 30-day complaint scan. If more than two bots, keep one boss. Live X + live web is the edge he claims.
- steal: one boss bot, jobs we already run (class notes, quizzes, 8/12/4/8 feeds)
- skip: his checkout-company setup, a pile of extra bots, Gmail briefs unless Tommy asks

### card

- title: make money with grok bot on autopilot (FULL GUIDE)
- author: @everestchris6
- date: Fri Aug 21 2026 10:30 AM PT
- url: https://x.com/everestchris6/status/2090854109960454524
- recap: Find stuck customers, build the fix, take payment. Bot computer unlocks no-API sites. CLI + JSON so output is parseable. First 2–3 runs supervised then unattended. Never refund, change price, or move money. High reject rate = fix scoring; near-all approve = that Bot is done. Posting as you stays manual. Money numbers are the author’s claims, not checked.
- apply: never refund, change price, or move money; first 2–3 runs supervised; posting as you stays manual

### card

- title: Grok Bot Architecture Blueprint: 24/7 Autonomous Agent Team
- author: monokern @monokern
- date: Thu Aug 20 2026 10:25 AM PT
- url: https://x.com/monokern/status/2090490444224331787
- recap: One orchestrator as the only human door; specialists under it. Description = org chart. Login/2FA on the live computer, never in chat. Reversible = auto; send/pay/publish = ask. Persist under /workspace. Grok Bot for 24/7 browser/cloud; Cursor for interactive code/git.
- apply: never send/pay/publish without a yes; keep skills/state where they survive; one boss Bot; Cursor for code, cloud Bots for long browser jobs

### card

- title: Agent Experience Engineering
- author: EP @eptwts
- date: Aug 19 2026
- url: https://x.com/eptwts/status/2090117882286117136
- recap: Next skill is AX: build things agents can use, not pretty human-only screens. Searchable pile + a command the bot can type beats a nicer app. Screens stay so Tommy can scan mistakes. Thesis, not a how-to. No prices.
- steal: this is the default for anything we ship
- skip: none of the thesis; it is already locked

### card

- title: The Complete Guide to Kimi K3 Memory Engineering
- author: J.B. @VibeMarketer_
- date: Tue Aug 18 2026 6:30 AM PT
- url: https://x.com/VibeMarketer_/status/2089706595517366692
- recap: Memory not prompts. One recurring job, one source list, one current-view file. Each run returns only diffs (new/changed/confirmed/contradicted/old) plus why it matters. Build one system at a time. Start 10 names, a week of corrections, then widen.
- apply: one Grok Bot, persistent current-view file, daily change-only brief. Do not stand up three systems at once.

---

Money figures are author claims, not verified. Do not invent more cards.
