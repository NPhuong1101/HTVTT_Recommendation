import Papa from 'papaparse';

export const parseCSV = (csvText) => {
  return new Promise((resolve) => {
    Papa.parse(csvText, {
      header: true,
      complete: (results) => resolve(results.data),
    });
  });
};