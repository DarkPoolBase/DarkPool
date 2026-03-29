

## Fix Settings Page Header Spacing

### Problem
The `SectionLabel` headers ("Connected Wallet", "API Keys", "Notification Preferences") sit too close to the card content below them. The cards use `space-y-4` (16px) for all internal spacing, which doesn't give the section headers enough breathing room from the content.

### Changes — `src/pages/SettingsPage.tsx`

1. **Line 16**: Change `space-y-4` → `space-y-6` on the Wallet card
2. **Line 33**: Change `space-y-4` → `space-y-6` on the API Keys card
3. **Line 58**: Change `space-y-4` → `space-y-6` on the Notifications card

This increases the gap between each `SectionLabel` and the card content from 16px to 24px, giving the headers proper visual separation from the card borders and content below.

