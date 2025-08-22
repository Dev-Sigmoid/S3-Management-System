import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Folder, File, Download, Copy, Move, Trash2, ArrowLeft, Upload, Search, MoreVertical, FolderPlus, RefreshCw, Eye, AlertCircle,
  Home
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:4444';

// Configure axios defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

const BucketManagement = () => {
  const { id } = useParams(); // Get bucket name from URL
  const [bucketName, setBucketName] = useState(id || 'my-sample-bucket');
  const [currentPath, setCurrentPath] = useState('');
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availablePaths, setAvailablePaths] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState('');
  const [loadingPaths, setLoadingPaths] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);  

  // Clear messages after timeout
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Update bucket name when URL params change
  useEffect(() => {
    if (id) {
      setBucketName(decodeURIComponent(id));
    }
  }, [id]);

  // Load items on component mount and when path changes
  useEffect(() => {
    loadItems();
  }, [currentPath, bucketName]);

  // Load items from API
  const loadItems = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const params = {
        prefix: currentPath || ''
      };
      
      const response = await api.get(`/objects/${bucketName}`, { params });
      
      if (response.data.success) {
        // Filter items to show only direct children of current path
        const currentDepth = currentPath ? currentPath.split('/').filter(p => p).length : 0;
        const filteredItems = response.data.items.filter(item => {
          // For root level
          if (currentDepth === 0) {
            return item.depth === 0;
          }
          // For nested levels
          return item.parent_folder === currentPath && item.depth === currentDepth;
        });

        setItems(filteredItems.map(item => ({
          name: item.name,
          type: item.type,
          size: item.size ? formatFileSize(item.size) : '-',
          lastModified: item.last_modified ? new Date(item.last_modified).toLocaleDateString() : '-',
          key: item.key,
          path: item.path
        })));
      } else {
        setError(response.data.error || 'Failed to load items');
      }
    } catch (err) {
      setError(`Failed to load items: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Get all unique folder paths for copy/move operations
  const fetchAllDirectoryPaths = async () => {
    setLoadingPaths(true);
    try {
      const response = await api.get(`/objects/${bucketName}`);
      
      if (response.data.success) {
        const folderPaths = new Set(['']); // Root path
        
        response.data.items.forEach(item => {
          if (item.type === 'folder') {
            folderPaths.add(item.path);
          }
          // Also add parent directories
          const parts = item.path.split('/').filter(p => p);
          for (let i = 1; i < parts.length; i++) {
            const folderPath = parts.slice(0, i).join('/') + '/';
            folderPaths.add(folderPath);
          }
        });

        const pathsArray = Array.from(folderPaths)
          .filter(path => path !== currentPath) // Exclude current path
          .map(path => ({
            path,
            displayName: path === '' ? `${bucketName} (Root)` : path
          }))
          .sort((a, b) => a.displayName.localeCompare(b.displayName));

        setAvailablePaths(pathsArray);
      }
    } catch (err) {
      setError(`Failed to load directories: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoadingPaths(false);
    }
  };

  // Breadcrumb generation
  const getBreadcrumbs = () => {
    if (!currentPath) return [{ name: bucketName, path: '' }];
    const pathParts = currentPath.split('/').filter(part => part !== '');
    const breadcrumbs = [{ name: bucketName, path: '' }];
    
    let accumulatedPath = '';
    pathParts.forEach(part => {
      accumulatedPath += part + '/';
      breadcrumbs.push({ name: part, path: accumulatedPath });
    });
    
    return breadcrumbs;
  };

  // Filter items based on search
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle item selection
  const handleSelectItem = (itemKey) => {
    setSelectedItems(prev => 
      prev.includes(itemKey) 
        ? prev.filter(key => key !== itemKey)
        : [...prev, itemKey]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.key));
    }
  };

  // Navigate to folder
  const navigateToFolder = (folderPath) => {
    setCurrentPath(folderPath);
    setSelectedItems([]);
  };

  // Navigate back
  const navigateBack = () => {
    const pathParts = currentPath.split('/').filter(part => part !== '');
    pathParts.pop();
    const newPath = pathParts.join('/');
    setCurrentPath(newPath ? newPath + '/' : '');
    setSelectedItems([]);
  };

  // Create new folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Folder name cannot be empty');
      return;
    }

    try {
      const folderPath = currentPath + newFolderName;
      
      await api.post('/folder', null, {
        params: {
          bucket_name: bucketName,
          folder_name: folderPath
        }
      });

      setSuccess(`Folder "${newFolderName}" created successfully`);
      setShowNewFolderModal(false);
      setNewFolderName('');
      loadItems();
    } catch (err) {
      setError(`Failed to create folder: ${err.response?.data?.detail || err.message}`);
    }
  };

  // Delete items
  const handleDelete = async (itemKeys) => {
    if (!window.confirm(`Are you sure you want to delete ${itemKeys.length} item(s)?`)) {
      return;
    }

    try {
      for (const key of itemKeys) {
        await api.delete('/object', {
          params: {
            bucket_name: bucketName,
            key: key
          }
        });
      }

      setSuccess(`Successfully deleted ${itemKeys.length} item(s)`);
      setSelectedItems([]);
      loadItems();
    } catch (err) {
      setError(`Failed to delete items: ${err.response?.data?.detail || err.message}`);
    }
  };

  // Copy items
  const handleCopyItems = async () => {
    if (!selectedDestination && selectedDestination !== '') {
      setError('Please select a destination directory');
      return;
    }

    try {
      for (const sourceKey of selectedItems) {
        const item = items.find(i => i.key === sourceKey);
        const fileName = item.name;
        const destKey = selectedDestination + fileName;

        await api.post('/copy', null, {
          params: {
            bucket_name: bucketName,
            source_key: sourceKey,
            dest_key: destKey
          }
        });
      }

      setSuccess(`Successfully copied ${selectedItems.length} item(s)`);
      setShowCopyModal(false);
      setSelectedItems([]);
      loadItems();
    } catch (err) {
      setError(`Failed to copy items: ${err.response?.data?.detail || err.message}`);
    }
  };

  // Move items
  const handleMoveItems = async () => {
    if (!selectedDestination && selectedDestination !== '') {
      setError('Please select a destination directory');
      return;
    }

    try {
      for (const sourceKey of selectedItems) {
        const item = items.find(i => i.key === sourceKey);
        const fileName = item.name;
        const destKey = selectedDestination + fileName;

        await api.post('/move', null, {
          params: {
            bucket_name: bucketName,
            source_key: sourceKey,
            dest_key: destKey
          }
        });
      }

      setSuccess(`Successfully moved ${selectedItems.length} item(s)`);
      setShowMoveModal(false);
      setSelectedItems([]);
      loadItems();
    } catch (err) {
      setError(`Failed to move items: ${err.response?.data?.detail || err.message}`);
    }
  };

  // File upload
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        const key = currentPath + file.name;

        await api.post('/upload', formData, {
          params: {
            bucket_name: bucketName,
            key: key
          },
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      setSuccess(`Successfully uploaded ${files.length} file(s)`);
      loadItems();
    } catch (err) {
      setError(`Failed to upload files: ${err.response?.data?.detail || err.message}`);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Download file (placeholder)
  const handleDownload = (itemKey) => {
    // This would typically generate a pre-signed URL for download
    console.log(`Download would be implemented for: ${itemKey}`);
    setError('Download functionality requires pre-signed URL implementation');
  };

  const openCopyModal = async () => {
    setShowCopyModal(true);
    setSelectedDestination('');
    await fetchAllDirectoryPaths();
  };

  const openMoveModal = async () => {
    setShowMoveModal(true);
    setSelectedDestination('');
    await fetchAllDirectoryPaths();
  };

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <div className="shadow-sm border-b bg-[rgba(255,255,255,0.50)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={navigateBack}
                disabled={!currentPath}
                className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">File Explorer</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={loadItems}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button 
                onClick={() => setShowNewFolderModal(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </button>
            </div>
          </div>

          {/* Breadcrumbs */}
          <div className="flex items-center space-x-2 p-3 mb-5 border border-gray-400 w-fit rounded-md">
            <Home className='text-gray-500'/>
            <div className='pt-1 space-x-2'>
              {getBreadcrumbs().map((crumb, index) => (
                <React.Fragment key={crumb.path}>
                  {index > 0 && <span className="text-gray-400">/</span>}
                  <button
                    onClick={() => navigateToFolder(crumb.path)}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
            
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {(error || success) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {error && (
            <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-md mb-4">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <span className="text-red-700">{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-md mb-4">
              <div className="w-5 h-5 bg-green-500 rounded-full mr-3 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-green-700">{success}</span>
            </div>
          )}
        </div>
      )}

      {/* Search and Actions Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="bg-white rounded-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search files and folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
            />
          </div>

          {selectedItems.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedItems.length} selected
              </span>
              
              <button
                onClick={openCopyModal}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </button>
              
              <button
                onClick={openMoveModal}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Move className="w-4 h-4 mr-2" />
                Move
              </button>
              
              <button
                onClick={() => handleDelete(selectedItems)}
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* File Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mr-3" />
              <span className="text-gray-600">Loading...</span>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Modified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr
                    key={item.key}
                    className={`hover:bg-gray-50 ${selectedItems.includes(item.key) ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.key)}
                        onChange={() => handleSelectItem(item.key)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.type === 'folder' ? (
                          <Folder className="w-5 h-5 text-blue-500 mr-3" />
                        ) : (
                          <File className="w-5 h-5 text-gray-400 mr-3" />
                        )}
                        
                        <button
                          onClick={() => item.type === 'folder' ? navigateToFolder(item.key) : null}
                          className={`text-sm font-medium ${
                            item.type === 'folder' 
                              ? 'text-blue-600 hover:text-blue-800 hover:underline' 
                              : 'text-gray-900'
                          }`}
                        >
                          {item.name}
                        </button>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.size}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.lastModified}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {item.type === 'file' && (
                          <>
                            <button
                              onClick={() => handleDownload(item.key)}
                              className="text-gray-400 hover:text-blue-600 p-1"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            
                            <button
                              className="text-gray-400 hover:text-green-600 p-1"
                              title="Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        <button
                          className="text-gray-400 hover:text-blue-600 p-1"
                          title="More actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {!isLoading && filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                {searchTerm ? 'No files found matching your search.' : 'This folder is empty.'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.70)] bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Create New Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowNewFolderModal(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.70)] bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Copy Items</h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose destination for {selectedItems.length} selected item(s):
            </p>
            
            {loadingPaths ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-5 h-5 animate-spin text-gray-400 mr-2" />
                <span className="text-gray-600">Loading directories...</span>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination Directory:
                </label>
                <select
                  value={selectedDestination}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select destination...</option>
                  {availablePaths.map((pathObj) => (
                    <option key={pathObj.path} value={pathObj.path}>
                      {pathObj.displayName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCopyModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCopyItems}
                disabled={loadingPaths}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.70)] bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Move Items</h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose destination for {selectedItems.length} selected item(s):
            </p>
            
            {loadingPaths ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-5 h-5 animate-spin text-gray-400 mr-2" />
                <span className="text-gray-600">Loading directories...</span>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination Directory:
                </label>
                <select
                  value={selectedDestination}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select destination...</option>
                  {availablePaths.map((pathObj) => (
                    <option key={pathObj.path} value={pathObj.path}>
                      {pathObj.displayName}
                    </option>
                  ))}
                </select>
                
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex">
                    <div className="text-yellow-600 text-sm">
                      ⚠️ <strong>Warning:</strong> Moving will permanently relocate the selected items.
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowMoveModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMoveItems}
                disabled={loadingPaths}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BucketManagement;