import fs from 'node:fs';
import path from 'node:path';

const directoryPath = path.join(__dirname, '../i18n', 'locales');

const formatAndSortJsonFiles = async () => {
  try {
    // Get all JSON files in the directory
    const files = fs.readdirSync(directoryPath).filter((file) => file.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(directoryPath, file);

      // Read the JSON file
      const rawData = fs.readFileSync(filePath, 'utf-8');

      // Parse the JSON data
      const jsonData = JSON.parse(rawData);

      // Sort the keys alphabetically
      const sortedJson = Object.keys(jsonData)
        .sort()
        .reduce(
          (sortedObj, key) => {
            sortedObj[key] = jsonData[key];
            return sortedObj;
          },
          {} as Record<string, string>
        );

      // Write the formatted and sorted JSON back to the file
      fs.writeFileSync(filePath, JSON.stringify(sortedJson, null, 2));

      console.log(`Formatted and sorted: ${file}`);
    }

    console.log('All JSON files have been formatted and sorted successfully!');
  } catch (error) {
    console.error('Error processing JSON files:', error);
  }
};

formatAndSortJsonFiles();
