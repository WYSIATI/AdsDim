import type { ReactElement } from 'react';
import { getMessages } from '../../src/i18n';
import type { AdTier } from '../../src/types';
import { Segmented, Switch } from './components';
import { useSettings } from './use-settings';

const TIERS: readonly AdTier[] = ['hard', 'soft', 'potential'];

export function App(): ReactElement {
  const { settings, update } = useSettings();
  const t = getMessages(navigator.language);

  if (settings === null) {
    return <main className="popup popup--loading" aria-busy="true" />;
  }

  return (
    <main className="popup">
      <header className="header">
        <h1>{t.popup.title}</h1>
        <p className="tagline">{t.popup.tagline}</p>
      </header>

      <Switch
        id="adsdim-enabled"
        label={t.popup.enabled}
        checked={settings.enabled}
        onChange={(enabled) => update({ enabled })}
      />

      <fieldset disabled={!settings.enabled} className="controls">
        <Segmented
          label={t.popup.scheme}
          value={settings.scheme}
          options={[
            { value: 'glass', label: t.popup.schemes.glass },
            { value: 'glow', label: t.popup.schemes.glow },
            { value: 'theater', label: t.popup.schemes.theater },
          ]}
          onChange={(scheme) => update({ scheme })}
        />

        <Segmented
          label={t.popup.contrast}
          value={settings.contrast}
          options={[
            { value: 'normal', label: t.popup.contrasts.normal },
            { value: 'strong', label: t.popup.contrasts.strong },
          ]}
          onChange={(contrast) => update({ contrast })}
        />

        <div className="tiers">
          <span className="tiers-label">{t.popup.tiers}</span>
          {TIERS.map((tier) => (
            <Switch
              key={tier}
              id={`adsdim-tier-${tier}`}
              label={t.popup.tierLabels[tier]}
              checked={settings.tiers[tier]}
              onChange={(checked) => update({ tiers: { ...settings.tiers, [tier]: checked } })}
            />
          ))}
        </div>
      </fieldset>

      <footer className="privacy">{t.popup.privacy}</footer>
    </main>
  );
}
