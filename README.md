<div align=center>

<!-- labels -->

![][ci] ![][views] ![][stars] ![][forks] ![][issues] ![][license] ![][repo-size]

<!-- title -->

# Lipi

### [WIP] 🚀 A SAAS web app, a Notion.so replica, featuring real-time collaboration and customizable workspaces built using ▲ Next.js, shadcn/ui, TailwindCSS

<picture>
  <source media="(prefers-color-scheme: light)" srcset="https://graph.org/file/93d7d38ec83bc4e9ba1d3.png">
  <source media="(prefers-color-scheme: dark)" srcset="https://graph.org/file/ad59213e3b1ece0bdc95e.png">
  <img src="https://graph.org/file/93d7d38ec83bc4e9ba1d3.png" alt="lipi">
</picture>

**[<kbd> <br> &nbsp;**Live Demo**&nbsp; <br> </kbd>][site]**

> Lipi is a portfolio showcase project (declared goal), not a commercial product.

Product requirements: [docs/requirements/requirements.md](docs/requirements/requirements.md). Open work: [docs/TODO.md](docs/TODO.md). Other docs live in [docs/](docs/).

## Building from Source

</div>

- Fetch latest source code from master branch.

```
git clone https://github.com/rajput-hemant/lipi
cd lipi
```

- Install Bun 1.4.2, then follow [docs/local-development.md](docs/local-development.md). In short: copy **.env.example** to **.env.local**, then:

```
bun i
bun run db:up        # Postgres, Redis, REST adapter only (no app container)
bun run db:setup     # auth tables, Lipi tables, local seed
bun run dev
```

<div align=center>

### Deploy Your Own

The button below clones the repository into Vercel and prompts for the core variables (auth, database, Redis). It deploys the Next.js app only, so the result is not complete on its own:

- Real-time collaboration needs the standalone Hocuspocus process (`bun run realtime:start`) on an always-on Node.js host. It is not a Vercel function. Set `NEXT_PUBLIC_LIPI_REALTIME_URL` and `LIPI_REALTIME_ALLOWED_ORIGINS` as described in [docs/guides/realtime.md](docs/guides/realtime.md). Without them the editor has no realtime endpoint in production.
- Billing (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PRO`) and uploads (`UPLOADTHING_TOKEN`, `UPLOADTHING_SECRET`, `UPLOADTHING_APP_ID`) are optional and not prompted for. Those features stay disabled until you add them.
- The database schema is not migrated by the deploy; run `bun run db:auth` and `bun run db:migrate` against your database. See [.env.example](.env.example) for every variable.

[![Deploy with Vercel](https://vercel.com/button)][deploy]

## Star History

<a href="https://star-history.com/#rajput-hemant/lipi">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=rajput-hemant/lipi&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=rajput-hemant/lipi" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=rajput-hemant/lipi" />
 </picture>
</a>

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributors:

[![][contributors]][contributors-graph]

_Note: It may take up to 24h for the [contrib.rocks][contrib-rocks] plugin to update because it's refreshed once a day._

</div>

<!----------------------------------{ Labels }--------------------------------->

[views]: https://komarev.com/ghpvc/?username=lipi&label=view%20counter&color=red&style=flat
[repo-size]: https://img.shields.io/github/repo-size/rajput-hemant/lipi
[issues]: https://img.shields.io/github/issues-raw/rajput-hemant/lipi
[license]: https://img.shields.io/github/license/rajput-hemant/lipi
[forks]: https://img.shields.io/github/forks/rajput-hemant/lipi?style=flat
[stars]: https://img.shields.io/github/stars/rajput-hemant/lipi
[contributors]: https://contrib.rocks/image?repo=rajput-hemant/lipi&max=500
[contributors-graph]: https://github.com/rajput-hemant/lipi/graphs/contributors
[contrib-rocks]: https://contrib.rocks/preview?repo=rajput-hemant%2Flipi
[ci]: https://github.com/rajput-hemant/lipi/actions/workflows/ci.yml/badge.svg

<!-----------------------------------{ Links }---------------------------------->

[site]: https://lipi.rajputhemant.me
[deploy]: https://vercel.com/new/clone?repository-url=https://github.com/rajput-hemant/lipi&project-name=lipi&repo-name=lipi&env=AUTH_SECRET,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,GITHUB_CLIENT_ID,GITHUB_CLIENT_SECRET,DATABASE_URL,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN,ENABLE_RATE_LIMITING,RATE_LIMITING_REQUESTS_PER_SECOND
