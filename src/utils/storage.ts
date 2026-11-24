// localStorage can be unavailable (private mode, blocked site data), so every
// read and write is wrapped. Without it, progress lasts for this visit only.

export const loadJson = (key: string): unknown => {
  try {
    const text = localStorage.getItem(key);
    return text === null ? null : JSON.parse(text);
  } catch {
    return null;
  }
};

export const saveJson = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // See above
  }
};

export const removeKey = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // See above
  }
};
