// src/components/contribute/ContributePage.tsx
import type { ReactNode } from 'react';
import { useDevice } from '../../lib/device/DeviceContext';
import { ConnectPanel } from '../device/ConnectPanel';
import { Card } from '../ui';
import { ProbePanel } from '../compatibility/ProbePanel';
import { measureIssueUrl, programsIssueUrl } from '../../lib/contribute/asks';

/**
 * How owners help: confirm on their own Nord what OpenNord has mapped.
 * Three short steps a musician can do: a read-only check, a few of their own programs,
 * and (optionally) measurements that stay on their computer.
 */
export function ContributePage() {
  const { session, deviceName, setConnection } = useDevice();
  const name = deviceName || undefined;
  return (
    <section className="max-w-[720px]">
      <h1 className="m-0 text-[18px] font-extrabold text-ink">Help confirm OpenNord on your Nord</h1>
      <p className="ps-sub">
        OpenNord learns how each Nord works from the instrument&rsquo;s own software. What we can&rsquo;t
        do on our own is check it on every model. That&rsquo;s where you come in: a few small things,
        about 10 minutes, no technical skills needed.
      </p>

      <ol className="m-0 mt-4 grid list-none gap-3 p-0">
        <Ask n={1} title="Check your Nord" time="2 min">
          <p className="ps-sub">
            Connect it (Chrome or Edge on a computer, or the iPad app) and run the check. It only
            reads; nothing on your keyboard changes. Then share the result in one click.
          </p>
          {session ? <ProbePanel /> : (
            <ConnectPanel inline onConnected={(s, e, n, pid) => setConnection(s, e, n, pid)} />
          )}
        </Ask>
        <Ask n={2} title="Share two or three of your programs" time="5 min">
          <p className="ps-sub">
            Programs you made hold only settings, never Nord sounds, so they&rsquo;re yours to share.
            Note what your Nord shows for them (organ, amp, effects, rotary speed), and we check that
            OpenNord shows the same.
          </p>
          <a className="on-btn on-btn--secondary" href={programsIssueUrl(name)} target="_blank" rel="noreferrer">
            Share programs
          </a>
        </Ask>
        <Ask n={3} title="Measure a few sounds" time="10 min, optional">
          <p className="ps-sub">
            Have an audio interface? Measuring a few notes helps OpenNord&rsquo;s organ, piano and
            effects sound like your model. Tell us which Nord you have and we&rsquo;ll send a short
            list. Your recordings stay on your computer; you only share the numbers.
          </p>
          <a className="on-btn on-btn--secondary" href={measureIssueUrl(name)} target="_blank" rel="noreferrer">
            Offer to measure
          </a>
        </Ask>
      </ol>
    </section>
  );
}

/** One numbered ask on the page. */
function Ask({ n, title, time, children }: { n: number; title: string; time: string; children: ReactNode }) {
  return (
    <li>
      <Card>
        <h2 className="m-0 text-[15px] font-bold text-ink">
          {n}. {title} <span className="text-[12px] font-medium text-dim">· {time}</span>
        </h2>
        {children}
      </Card>
    </li>
  );
}
