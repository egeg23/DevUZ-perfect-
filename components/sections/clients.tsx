import type { CSSProperties } from "react";

import { Container } from "@/components/ui/container";
import { clientRows, logoBox, type Client } from "@/content/clients";
import type { Dictionary } from "@/content/dictionaries";

/**
 * «Делали для» — логотипы брендов двумя встречными лентами под первым
 * экраном.
 *
 * Логотип — маска, а не картинка: цвет даёт тема. У брендов десятки своих
 * цветов, и пёстрая лента спорила бы с первым экраном. Размер считает
 * `logoBox` по пропорциям файла: широкая надпись и квадратный знак весят на
 * глаз одинаково.
 *
 * Лента продублирована, как у стека: вторая копия въезжает, когда первая
 * уходит. Копия скрыта от экранного чтения — бренд называется один раз.
 */
export function ClientsSection({ dict }: { dict: Dictionary }) {
  return (
    <section aria-labelledby="clients-title" className="border-t border-line py-12 sm:py-14">
      <Container>
        <h2
          id="clients-title"
          className="text-center font-mono text-[0.72rem] uppercase tracking-[0.3em] text-muted"
        >
          {dict.clients.title}
        </h2>
      </Container>

      <div className="mt-8 space-y-6 sm:space-y-8">
        {clientRows.map((row, r) => (
          <div key={r} className="logo-row marquee-mask overflow-hidden">
            <ul
              className={`logo-track flex w-max items-center ${r % 2 ? "is-rev" : ""}`}
              style={{ "--logo-speed": `${row.length * 4.5}s` } as CSSProperties}
            >
              {row.map((client) => (
                <Logo key={client.slug} client={client} />
              ))}
              {row.map((client) => (
                <Logo key={`${client.slug}-copy`} client={client} copy />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function Logo({ client, copy = false }: { client: Client; copy?: boolean }) {
  const { width, height } = logoBox(client.ratio);
  return (
    <li className="shrink-0 px-6 sm:px-9" aria-hidden={copy || undefined} data-copy={copy || undefined}>
      <span
        role={copy ? undefined : "img"}
        aria-label={copy ? undefined : client.name}
        title={client.name}
        className="logo-mark block"
        style={
          {
            "--w": `${width}px`,
            "--h": `${height}px`,
            maskImage: `url(${client.logo})`,
            WebkitMaskImage: `url(${client.logo})`,
          } as CSSProperties
        }
      />
    </li>
  );
}
