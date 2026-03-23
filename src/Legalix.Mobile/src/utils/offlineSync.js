import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_EXPENSES_KEY = '@pending_expenses';

export const saveOfflineExpense = async (expenseData) => {
  try {
    const existing = await AsyncStorage.getItem(PENDING_EXPENSES_KEY);
    const expenses = existing ? JSON.parse(existing) : [];
    expenses.push({ ...expenseData, id: Date.now() });
    await AsyncStorage.setItem(PENDING_EXPENSES_KEY, JSON.stringify(expenses));
  } catch (e) {
    console.error("Error saving offline", e);
  }
};

export const getPendingSync = async () => {
    const data = await AsyncStorage.getItem(PENDING_EXPENSES_KEY);
    return data ? JSON.parse(data) : [];
};
