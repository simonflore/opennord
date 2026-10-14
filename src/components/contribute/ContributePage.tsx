// src/components/contribute/ContributePage.tsx
import type { ReactNode } from 'react';
import { useDevice } from '../../lib/device/DeviceContext';
import { ConnectPanel } from '../device/ConnectPanel';
import { Card } from '../ui';
import { ProbePanel } from '../compatibility/ProbePanel';
import { FileSupportToggle } from '../about/FileSupportToggle';
import { useCapabilities } from '../../lib/capabilities/CapabilitiesContext';

const copy = 'my-2 text-[13px] leading-[1.55] text-dim';

/**
 * How owners help: confirm on their own Nord what OpenNord has mapped.
 * Two short steps a musician can do: a read-only check and the opt-in
 * file-support reports. Programs or anything else go to the community or by mail.
 */
export function ContributePage() {
  const { session, setConnection } = useDevice();
  const community = useCapabilities().community.available;
  return (
    <section className="max-w-[720px]">
      <h1 className="m-0 text-[18px] font-extrabold text-ink">Help confirm OpenNord on your Nord</h1>
      <p className={copy}>
        OpenNord learns how each Nord works from the instrument&rsquo;s own software. What we can&rsquo;t
        do on our own is check it on every model. That&rsquo;s where you come in: two small things,
        a couple of minutes, no technical skills needed.
      </p>

      <ol className="m-0 mt-4 grid list-none gap-3 p-0">
        <Ask n={1} title="Check your Nord" time="2 min">
          <p className={copy}>
            Connect it (Chrome or Edge on a computer) and run the check. It only
            reads; nothing on your keyboard changes. Then share the result in one click.
          </p>
          {session ? <ProbePanel /> : (
            <ConnectPanel inline onConnected={(s, e, n, pid) => setConnection(s, e, n, pid)} />
          )}
        </Ask>
        <Ask n={2} title="Help improve file support" time="1 click">
          <FileSupportToggle className="mt-2" showTitle={false} />
        </Ask>
      </ol>
      <p className={copy}>
        Want to share programs you made, or anything else?{' '}
        {community ? 'Post them in the community, or mail ' : 'Mail '}
        <a className="text-ink underline" href="mailto:opennord@gigmeister.app">opennord@gigmeister.app</a>.
      </p>
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
