import { Card, BuyMeACoffeeButton } from '../ui';

const secH = 'mb-1 text-[13px] font-bold text-ink';
const secP = 'm-0 text-[13px] leading-[1.55] text-dim';
const strong = 'font-semibold text-ink';

/**
 * About & legal surface for the hosted app. The repo carries the full LICENSE /
 * docs/LEGAL.md / ATTRIBUTION; this puts the user-facing essentials in front of
 * anyone using the web app: the non-affiliation disclaimer (required on every
 * surface — docs/LEGAL.md), the privacy posture (all client-side), the
 * sharing/sound-content line, the license + no-warranty notice, and credits.
 *
 * No public source link while the repository is private — see the AGPL §13 note
 * in docs/LEGAL.md before the app is opened to other users.
 */
export function AboutView() {
  return (
    <div className="max-w-[640px]">
      <div className="mb-4">
        <div className="text-[18px] font-extrabold text-ink">About OpenNord</div>
        <div className="mt-0.5 text-[13px] text-dim">An open, AI-native companion for the Nord Stage 4.</div>
      </div>

      <div className="flex flex-col gap-3">
        <Card accent>
          <div className={secH}>Not affiliated with Nord</div>
          <p className={secP}>
            OpenNord is an independent, community-built tool. It is{' '}
            <strong className={strong}>not affiliated with, endorsed by, or connected to Clavia DMI AB
            or Nord Keyboards.</strong> “Nord”, “Nord Stage”, and related names are
            trademarks of their owner, used here only to describe what OpenNord is
            compatible with.
          </p>
        </Card>

        <Card>
          <div className={secH}>Your music stays on your device</div>
          <p className={secP}>
            OpenNord runs entirely in your browser. The files you open are read and
            decoded on your own device — nothing is uploaded to a server, and there
            is no tracking or analytics.
          </p>
        </Card>

        <Card>
          <div className={secH}>You only share your own work</div>
          <p className={secP}>
            OpenNord never copies or shares Nord’s factory sounds. A program
            describes your settings and points to samples by name — the audio stays
            on your instrument. What you share is your own creative work.
          </p>
        </Card>

        <Card>
          <div className={secH}>License &amp; warranty</div>
          <p className={secP}>
            OpenNord is free software, licensed under the GNU{' '}
            <strong className={strong}>AGPL-3.0-or-later</strong>. It is provided <strong className={strong}>“as is”,
            without warranty of any kind.</strong> This is early <strong className={strong}>alpha</strong>{' '}
            software — features may change or break, and device transfer writes to
            real hardware, so back up your keyboard and use it at your own risk.
          </p>
        </Card>

        <Card>
          <div className={secH}>Support OpenNord</div>
          <p className={secP}>
            OpenNord is free and open source, built in the open. If it’s useful to
            you and you’d like to help keep the work going, you can buy me a coffee.
            Entirely optional — and always appreciated.
          </p>
          <BuyMeACoffeeButton className="mt-3" />
        </Card>

        <Card>
          <div className={secH}>Credits</div>
          <p className={secP}>
            OpenNord’s <code>.ns4p</code> decoding started from{' '}
            <strong className={strong}>ns4decode</strong> by Randy (MIT) — since ported, substantially
            extended to cover more engines and cases, and validated against real
            hardware. The device USB transfer protocol and the wider file-format
            support are OpenNord’s own reverse-engineering.
          </p>
        </Card>
      </div>

      <div className="mt-4 text-[11px] text-muted">OpenNord · alpha</div>
    </div>
  );
}
