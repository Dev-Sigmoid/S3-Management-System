import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios'
import { env } from '../environment';
import { RefreshCw } from 'lucide-react';

function BucketItems() {
  const navigate = useNavigate()
  const [buckets, setBuckets] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [bucketToDelete, setBucketToDelete] = useState('')
  
  // Form states
  const [newBucketName, setNewBucketName] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('us-east-1')
  const [forceDelete, setForceDelete] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const listBucket = async () => {
    setLoading(true)
    try {
      const data = await axios.get(`${env.url}buckets`)
      setBuckets(data.data.buckets)
    } catch (error) {
      console.error('Error fetching buckets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    listBucket()
  }, [])

  const nav = (bucketName) => {
    navigate(`/bucketContents/${bucketName}`)
  }

  // Handle delete icon click
  const handleDeleteClick = (e, bucketName) => {
    e.stopPropagation() // Prevent card click navigation
    setBucketToDelete(bucketName)
    setShowDeleteModal(true)
  }

  // Handle create bucket
  const handleCreateBucket = async () => {
    if (!newBucketName.trim()) {
      alert('Please enter a bucket name')
      return
    }

    setIsCreating(true)
    try {
      const response = await axios.post(`${env.url}bucket/${newBucketName}`)

      // Check if response indicates success
      if (response.data && (response.data.success === true || response.data.message)) {
        alert(`Bucket '${newBucketName}' created successfully!`)
        setShowCreateModal(false)
        setNewBucketName('')
        setSelectedRegion('us-east-1')
        await listBucket() // Refresh bucket list
      } else {
        // Handle case where success is not explicitly true but no error occurred
        const errorMsg = response.data?.error || 'Unknown error occurred'
        alert(`Error: ${errorMsg}`)
      }
    } catch (error) {
      console.error('Error creating bucket:', error)
      // Check if it's actually a successful creation but different response format
      if (error.response?.status === 200 || error.response?.status === 201) {
        alert(`Bucket '${newBucketName}' created successfully!`)
        setShowCreateModal(false)
        setNewBucketName('')
        setSelectedRegion('us-east-1')
        await listBucket()
      } else {
        const errorMsg = error.response?.data?.error || error.message || 'Failed to create bucket'
        alert(`Failed to create bucket: ${errorMsg}`)
      }
    } finally {
      setIsCreating(false)
    }
  }

  // Handle delete bucket
  const handleDeleteBucket = async () => {
    setIsDeleting(true)
    try {
      const response = await axios.delete(`${env.url}bucket/${bucketToDelete}`, {
        params: { force_delete: forceDelete }
      })

      // Check if response indicates success
      if (response.data && (response.data.success === true || response.data.message)) {
        alert(`Bucket '${bucketToDelete}' deleted successfully!`)
        setShowDeleteModal(false)
        setBucketToDelete('')
        setForceDelete(false)
        await listBucket() // Refresh bucket list
      } else {
        const errorMsg = response.data?.error || 'Unknown error occurred'
        alert(`Error: ${errorMsg}`)
      }
    } catch (error) {
      console.error('Error deleting bucket:', error)
      // Check if it's actually a successful deletion but different response format
      if (error.response?.status === 200 || error.response?.status === 204) {
        alert(`Bucket '${bucketToDelete}' deleted successfully!`)
        setShowDeleteModal(false)
        setBucketToDelete('')
        setForceDelete(false)
        await listBucket()
      } else {
        const errorMsg = error.response?.data?.error || error.message || 'Failed to delete bucket'
        alert(`Failed to delete bucket: ${errorMsg}`)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  // Close modals
  const closeCreateModal = () => {
    setShowCreateModal(false)
    setNewBucketName('')
    setSelectedRegion('us-east-1')
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setBucketToDelete('')
    setForceDelete(false)
  }

  if (loading) {
    return (
      <div className='h-full flex justify-center items-center'>
        <RefreshCw size={30} color='gray' className='animate-spin'></RefreshCw>
      </div>
    )
  }

  return (
    <>
      <div className='h-[15%] bg-[rgba(255,255,255,0.50)] flex justify-center items-center'>
        <p className='text-4xl font-semibold text-white' style={{ textShadow: "1px 1px 3px rgba(0, 0, 0, 0.64)" }}>
          Bucket Management
        </p>
      </div>
      <div className='h-[10%] flex justify-start items-end px-11'>
        <button 
          onClick={() => setShowCreateModal(true)}
          className='glass-card-btn active:scale-[1.06] cursor-pointer transition-transform duration-200 ease-in-out font-semibold' 
          style={{textShadow: "1px 1px 3px rgba(0, 0, 0, 0.64)"}}
        >
          Create Bucket
        </button>
      </div>
      <div className='flex flex-wrap p-10 gap-12 h-[75%] w-full'>
        {buckets.map((bucket, index) => {
          const bucketName = typeof bucket === 'string' ? bucket : bucket.name;
          return (
            <div key={index} onClick={() => nav(bucketName)} className='glass-card hover:scale-[1.02] cursor-pointer transition-transform duration-200 ease-in-out relative'>
              <button onClick={(e) => handleDeleteClick(e, bucketName)} className='absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors duration-200 z-10' title="Delete bucket">×</button>
              <div className='h-full w-full flex flex-col justify-center gap-3 items-center'>
                <img className='w-12' src="src/assets/bucket1.png" alt="" />
                <p className='text-[15px] text-center font-semibold w-full text-gray-500' >{bucketName}</p>
              </div>
            </div>
          )
        })}
      </div>

      {showCreateModal && (
        <div className='fixed inset-0 bg-[rgba(0,0,0,0.80)] flex justify-center items-center z-50'>
          <div className='bg-white rounded-lg p-6 w-96 max-w-90vw'>
            <h2 className='text-2xl font-semibold mb-4 text-gray-800'>Create New Bucket</h2>
            
            <div className='mb-6'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Bucket Name
              </label>
              <input
                type='text'
                value={newBucketName}
                onChange={(e) => setNewBucketName(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Enter bucket name'
                disabled={isCreating}
              />
              <p className='text-xs text-gray-500 mt-1'>
                Must be 3-63 characters, lowercase, and globally unique
              </p>
            </div>



            <div className='flex justify-end gap-3'>
              <button
                onClick={closeCreateModal}
                className='px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200'
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBucket}
                className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50'
                disabled={isCreating || !newBucketName.trim()}
              >
                {isCreating ? 'Creating...' : 'Create Bucket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className='fixed inset-0 bg-[rgba(0,0,0,0.80)] flex justify-center items-center z-50'>
          <div className='bg-white rounded-lg p-6 w-96 max-w-90vw'>
            <h2 className='text-2xl font-semibold mb-4 text-gray-800'>Delete Bucket</h2>
            
            <p className='text-gray-600 mb-4'>
              Are you sure you want to delete bucket <strong>"{bucketToDelete}"</strong>?
            </p>
            
            <div className='mb-6'>
              <label className='flex items-center'>
                <input
                  type='checkbox'
                  checked={forceDelete}
                  onChange={(e) => setForceDelete(e.target.checked)}
                  className='mr-2'
                  disabled={isDeleting}
                />
                <span className='text-sm text-gray-700'>
                  Force delete (delete all objects in bucket first)
                </span>
              </label>
              <p className='text-xs text-red-500 mt-1'>
                Warning: This action cannot be undone!
              </p>
            </div>

            <div className='flex justify-end gap-3'>
              <button
                onClick={closeDeleteModal}
                className='px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200'
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBucket}
                className='px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 disabled:opacity-50'
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Bucket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BucketItems