export const getCurrentMonthYear = (): string => {
    const now = new Date();
    const month = now.getMonth() + 1; 
    const year = now.getFullYear();
    return `${month.toString().padStart(2, '0')}/${year}`;
  };
  