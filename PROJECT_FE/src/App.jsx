import { Link, Links, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css'
import BucketManagement from './scenes/BucketManagement';
import BucketItems from './scenes/BucketItems';

function Layout(){
  return (
    // <div className='w-full h-full flex justify-center text-7xl text-white font-extrabold items-center' style={{textShadow:"3px 3px 8px rgba(0, 0, 0, 0.6)"}}>
    //   Bucket Management System
    // </div>
    <>
      <div className='h-[10%] bg-[rgba(255,255,255,0.50)]'>
        <div className='flex h-full justify-between px-6 items-center'>
          <p className='text-white font-semibold text-4xl' style={{textShadow:'3px 3px 8px rgba(0, 0, 0, 0.6)'}} >S3 Bucket Manager</p>
          <div className='w-fit py-3 px-3 bg-white'>
            <img className='w-30' src="src/assets/sigmoidLogo.jpg" alt="" />
          </div>
        </div>
      </div>
      <div className='h-[90%]'>
        <div className='h-full flex justify-center items-center'>
          <p className='font-bold text-6xl text-center text-[rgba(255,255,255,0.98)] leading-16 ' style={{textShadow:"1px 1px 3px rgba(0, 0, 0, 0.64)"}}>Simplify cloud storage.<br/>Manage buckets & files with ease.</p>
        </div>
      </div>
    </>
    
  )
}

function App() {

  return (
    <>
      <div className='w-full h-full color-gradient'>
        <div className='w-full h-full grid-container'>
          <div className='sidebar bg-[rgba(255,255,255,0.50)] pt-4 '>
            <div className='h-[90%] w-full flex flex-col justify-start items-center'>
              <Link to="/bucketItems" className='h-fit w-[80%] flex justify-center items-center color-gradient rounded-2xl p-4 box bg-[rgba(255,255,255,0.20)]'>
                <p className='font-bold text-[20px] text-white' style={{textShadow:"3px 3px 8px rgba(0, 0, 0, 0.6)"}} >Bucket Management</p>
              </Link>
            </div>
            <Link to='/' className='h-[10%] w-full flex p-8 cursor-pointer justify-between items-center' style={{borderTopWidth:"1px", borderColor:"rgba(0,0,0,0.20)"}}>
              <img className='w-10' src="src/assets/home.png" alt="" />
              <div className='h-12 w-12 rounded-full flex justify-center items-center bg-white' style={{borderWidth:'1px', borderColor:'rgba(0,0,0,0.20)'}}>
                <p className='text-2xl font-bold'>D</p>
              </div>
            </Link>
          </div>
          <div className='main'>
            <Routes>
              <Route path='/' element={<Layout/>} />
              <Route path='/bucketItems' element={<BucketItems/>} />
              <Route path='/bucketContents/:id' element={<BucketManagement/>} />
            </Routes>
          </div>
        </div>
      </div>
    </>
    
  )
}

export default App
