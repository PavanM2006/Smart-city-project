import JSZip from 'jszip';

// Helper to download the zip file in the browser
export async function downloadProjectZip(
  filesData: {
    backendPackageJson: string;
    backendEnvExample: string;
    backendServerJs: string;
    backendDbConfig: string;
    backendSchemaSql: string;
    backendAuthMiddleware: string;
    backendAuthController: string;
    backendComplaintController: string;
    backendApiRoutes: string;
    backendReadme: string;
    rootReadme: string;
    frontendAppTsx: string;
    frontendMainTxs: string;
    frontendIndexCss: string;
    frontendViteConfig: string;
    frontendTsConfig: string;
    frontendIndexHtml: string;
    frontendPackageJson: string;
  }
) {
  const zip = new JSZip();

  // Create Root files
  zip.file('README.md', filesData.rootReadme);
  zip.file('package.json', filesData.frontendPackageJson);
  zip.file('vite.config.ts', filesData.frontendViteConfig);
  zip.file('tsconfig.json', filesData.frontendTsConfig);
  zip.file('index.html', filesData.frontendIndexHtml);

  // Create Src folder
  const srcFolder = zip.folder('src');
  if (srcFolder) {
    srcFolder.file('App.tsx', filesData.frontendAppTsx);
    srcFolder.file('main.tsx', filesData.frontendMainTxs);
    srcFolder.file('index.css', filesData.frontendIndexCss);
    
    // Create src subfolders
    const dataFolder = srcFolder.folder('data');
    if (dataFolder) {
      // Re-create mockData.ts content
      dataFolder.file('mockData.ts', getMockDataContent());
    }

    const utilsFolder = srcFolder.folder('utils');
    if (utilsFolder) {
      utilsFolder.file('cn.ts', `import { ClassValue, clsx } from "clsx";\nimport { twMerge } from "tailwind-merge";\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}`);
      utilsFolder.file('sqlParser.ts', getSqlParserContent());
    }
  }

  // Create Backend folder
  const backendFolder = zip.folder('backend');
  if (backendFolder) {
    backendFolder.file('package.json', filesData.backendPackageJson);
    backendFolder.file('.env.example', filesData.backendEnvExample);
    backendFolder.file('server.js', filesData.backendServerJs);
    backendFolder.file('README.md', filesData.backendReadme);

    const configFolder = backendFolder.folder('config');
    if (configFolder) {
      configFolder.file('db.js', filesData.backendDbConfig);
    }

    const modelsFolder = backendFolder.folder('models');
    if (modelsFolder) {
      modelsFolder.file('schema.sql', filesData.backendSchemaSql);
    }

    const middlewareFolder = backendFolder.folder('middleware');
    if (middlewareFolder) {
      middlewareFolder.file('auth.js', filesData.backendAuthMiddleware);
    }

    const controllersFolder = backendFolder.folder('controllers');
    if (controllersFolder) {
      controllersFolder.file('authController.js', filesData.backendAuthController);
      controllersFolder.file('complaintController.js', filesData.backendComplaintController);
    }

    const routesFolder = backendFolder.folder('routes');
    if (routesFolder) {
      routesFolder.file('api.js', filesData.backendApiRoutes);
    }

    // Create an empty uploads folder placeholder
    backendFolder.folder('uploads');
  }

  // Generate ZIP
  const content = await zip.generateAsync({ type: 'blob' });
  
  // Trigger Download
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = 'smartcity-citizen-service-portal.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Helper strings to populate zipped files that are identical to local source
function getMockDataContent() {
  return `export interface User {
  id: number;
  name: string;
  email: string;
  role: 'citizen' | 'authority';
  avatar?: string;
  phone?: string;
}

export interface Department {
  department_id: number;
  department_name: string;
  head_officer: string;
  contact: string;
}

export interface Complaint {
  complaint_id: string;
  user_id: number;
  citizen_name: string;
  title: string;
  description: string;
  category: 'Pothole' | 'Garbage' | 'Water Leakage' | 'Streetlight Failure' | 'Other';
  image: string;
  location_lat: number;
  location_lng: number;
  location_address: string;
  status: 'Submitted' | 'Under Review' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
  department_id: number | null;
  created_at: string;
  updated_at: string;
  remarks: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
}

export interface Notification {
  notification_id: number;
  user_id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  is_read: boolean;
  created_at: string;
}
`;
}

function getSqlParserContent() {
  return `// SQL Parser for Browser Simulator
export function executeSQL(query: string, tables: any) {
  // Simple simulator for query executions
  return { columns: ['status'], rows: [['Connected']], count: 1 };
}
`;
}
