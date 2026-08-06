export interface FileItem {
  id: string  | number;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modifiedTime?: Date;
  parentId?: string;
}