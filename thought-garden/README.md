# Thought Garden: app

The Expo / React Native app. See the [project README](../README.md) for the product story and the live link.

```bash
npm install
npx expo start            # phone: open in Expo Go
npx expo export -p web    # web build into dist/
npx tsc --noEmit          # typecheck
npx jest                  # tests
```

Routes live in `src/app/` (Expo Router). Data is stored on-device with SQLite (`src/db/`), app state in a Zustand store (`src/store/`), and UI pieces are in `src/features/` and `src/ui/`.
