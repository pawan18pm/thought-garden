import { configure } from '@testing-library/react-native';

// The full suite runs screen tests in parallel workers; on a busy machine a cold first render
// can take a few seconds. These limits only matter when something is slow, never when it's broken:
// a real failure still fails, it just isn't mistaken for one because a worker was starved.
jest.setTimeout(30000);
configure({ asyncUtilTimeout: 8000 });
