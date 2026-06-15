import './about.css';
import { Card } from '../ui';

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
    <div className="about">
      <div className="about-head">
        <div className="about-title">About OpenNord</div>
        <div className="about-sub">An open, AI-native companion for the Nord Stage 4.</div>
      </div>

      <div className="about-stack">
        <Card accent className="about-sec">
          <div className="about-sec__h">Not affiliated with Nord</div>
          <p className="about-sec__p">
            OpenNord is an independent, community-built tool. It is{' '}
            <strong>not affiliated with, endorsed by, or connected to Clavia DMI AB
            or Nord Keyboards.</strong> “Nord”, “Nord Stage”, and related names are
            trademarks of their owner, used here only to describe what OpenNord is
            compatible with.
          </p>
        </Card>

        <Card className="about-sec">
          <div className="about-sec__h">Your music stays on your device</div>
          <p className="about-sec__p">
            OpenNord runs entirely in your browser. The files you open are read and
            decoded on your own device — nothing is uploaded to a server, and there
            is no tracking or analytics.
          </p>
        </Card>

        <Card className="about-sec">
          <div className="about-sec__h">You only share your own work</div>
          <p className="about-sec__p">
            OpenNord never copies or shares Nord’s factory sounds. A program
            describes your settings and points to samples by name — the audio stays
            on your instrument. What you share is your own creative work.
          </p>
        </Card>

        <Card className="about-sec">
          <div className="about-sec__h">License &amp; warranty</div>
          <p className="about-sec__p">
            OpenNord is free software, licensed under the GNU{' '}
            <strong>AGPL-3.0-or-later</strong>. It is provided <strong>“as is”,
            without warranty of any kind.</strong> This is early <strong>alpha</strong>{' '}
            software — features may change or break, and device transfer writes to
            real hardware, so back up your keyboard and use it at your own risk.
          </p>
        </Card>

        <Card className="about-sec">
          <div className="about-sec__h">Credits</div>
          <p className="about-sec__p">
            OpenNord’s <code>.ns4p</code> decoding started from{' '}
            <strong>ns4decode</strong> by Randy (MIT) — since ported, substantially
            extended to cover more engines and cases, and validated against real
            hardware. The device USB transfer protocol and the wider file-format
            support are OpenNord’s own reverse-engineering.
          </p>
        </Card>
      </div>

      <div className="about-foot">OpenNord · alpha</div>
    </div>
  );
}
