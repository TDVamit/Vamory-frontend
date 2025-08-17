import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { Sparkles, Users, Archive, Cloud, Share2, FileCheck, Video, Database, Search, Info, X, LogIn } from 'lucide-react';
import { Header } from './Header';
import { useAuth0Custom } from '../hooks/useAuth0';

const HomePage: React.FC = () => {
  const { isAuthenticated, login } = useAuth0Custom();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentAnimation, setCurrentAnimation] = useState(0);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deletionStartedRef = useRef(false);
  const gridImagesRef = useRef<string[]>([]);
  
  // Preload images for smoother transitions
  const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = src;
    });
  };

  // Background images array
  const backgroundImages = [
    '/background_images/images.jpg',
    '/background_images/forward-facing-realistic-generic-business-600nw-2419676197.webp',
    '/background_images/fdfs19-800x533.jpg',
    '/background_images/ai-generated-a-loving-cat-realistic-photo.jpg',
    '/background_images/67b7a45113939e130e851359_GV4_I3qxoLB9fht0U5nn3PUiOH1YPF2ImrBfdF8Ikyk.webp',
    '/background_images/5012feeb427bfb8cd752a54c605fae12e45f62a3-1724774777.jpg',
    '/background_images/1_IJhWbzlaGmoF9YuctqjEFQ.png',
    '/background_images/OOKNHulKeTAPb6HeIYhF--1--rum5i.webp',
    '/background_images/q=90,w=450.avif',
    '/background_images/66d6e38ee376471e864473ca_Frame 1698755911.png',
    '/background_images/every-single-site-ive-found-bans-all-realistic-ai-generated-v0-zfsg2qkiddmc1.webp',
    '/background_images/b2840d8b469e65d9a8962c65ebc040907c040f9d-1724774758.jpg',
    '/background_images/realistic-ai-generated-photographs-v0-90ozg87g58vc1.webp',
    '/background_images/65771d3481a13a31149ee6b5_realistic-person-creator.png',
    '/background_images/0_DLSAh92fdOJi-Dvi.jpg',
    '/background_images/driving-2.jpg',
    '/background_images/driving.jpeg',
    '/background_images/gardning-3.jpg',
    '/background_images/gardning-2.jpg',
    '/background_images/gardning.jpeg',
    '/background_images/alice-reading-book-4.jpg',
    '/background_images/alice-reading-book-3.jpg',
    '/background_images/alice-reading-book-2.jpg',
    '/background_images/alice-reading-book.jpg',
    '/background_images/HomeSpeaker_2_Tessa_Langford.avif',
    '/background_images/295nvsms_deepfake-generic_625x300_22_August_23.webp',
    '/background_images/PMSl8tKxmNjfYIAgPVSLN.webp',
    '/background_images/skynews-stock-porn_5517648.jpg',
    '/background_images/realistic-exact-render-from-3d-model-in-10-seconds.avif',
    '/background_images/openart-image_VFZH4wsl_1738652503563_raw.jpg',
    '/background_images/images (1).jpg',
    '/background_images/il_570xN.4170880008_eejo.webp',
    '/background_images/il_570xN.6507459578_9i4x.webp',
    '/background_images/ai_portrait-2.webp',
    '/background_images/Meta-Movie-Gen-Surfing-Koala.webp',
  ];

  // Grid state
  const [gridImages, setGridImages] = useState<string[]>([]);
  const [fadingIndices, setFadingIndices] = useState<Set<number>>(new Set());
  
  // Feature animation states
  const [faceDetectionStep, setFaceDetectionStep] = useState(0);
  const [archiveStep, setArchiveStep] = useState(0);
  const [migrationStep, setMigrationStep] = useState(0);
  const [sharingStep, setSharingStep] = useState(0);
  const [deduplicationStep, setDeduplicationStep] = useState(0);
  
  // Dropdown states
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  
  // Initialize grid with random images
  useEffect(() => {
    const initializeGrid = () => {
      const shuffled = [...backgroundImages].sort(() => Math.random() - 0.5);
      const initialGrid = shuffled.slice(0, 18); // 6x3 = 18 images
      setGridImages(initialGrid);
      gridImagesRef.current = initialGrid;
    };
    initializeGrid();
  }, []);

          // Random image replacement effect
   useEffect(() => {
     if (gridImagesRef.current.length === 0) return;

     let isAnimating = false;
     let animationTimeout: ReturnType<typeof setTimeout> | null = null;

     const animateImages = () => {
       if (isAnimating) return;
       
       isAnimating = true;
       
       // Clear any existing animation
       if (animationTimeout) {
         clearTimeout(animationTimeout);
       }
       
       // Select 3-4 random images to animate
       const numToAnimate = Math.floor(Math.random() * 2) + 1; 
       const indicesToAnimate: number[] = [];
       
       while (indicesToAnimate.length < numToAnimate) {
         const randomIndex = Math.floor(Math.random() * 18);
         if (!indicesToAnimate.includes(randomIndex)) {
           indicesToAnimate.push(randomIndex);
         }
       }
       
       // Get available images for replacement
       const currentGridImages = gridImagesRef.current;
       const availableImages = backgroundImages.filter(img => !currentGridImages.includes(img));
       
       if (availableImages.length >= numToAnimate) {
         // Animate each image with staggered timing
                               indicesToAnimate.forEach((index, i) => {
             const staggerDelay = i * 1200; // Increased stagger delay for smoother transitions
             
             setTimeout(() => {
               // Fade out
               setFadingIndices(prev => new Set([...prev, index]));
               
               // Replace image after fade out
               setTimeout(async () => {
                 // Get unique images that are not currently in the grid
                 const currentGridImages = gridImagesRef.current;
                 const currentImages = new Set(currentGridImages);
                 const uniqueAvailableImages = availableImages.filter(img => !currentImages.has(img));
                 
                 // If no unique images available, use any available image
                 const newImage = uniqueAvailableImages.length > 0 
                   ? uniqueAvailableImages[Math.floor(Math.random() * uniqueAvailableImages.length)]
                   : availableImages[Math.floor(Math.random() * availableImages.length)];
                 
                 // Preload the new image before showing it
                 try {
                   await preloadImage(newImage);
                   
                   // Update grid with preloaded image
                   setGridImages(prev => {
                     const newGrid = [...prev];
                     newGrid[index] = newImage;
                     gridImagesRef.current = newGrid;
                     return newGrid;
                   });
                   
                   // Fade in after image is loaded
                   setTimeout(() => {
                     setFadingIndices(prev => {
                       const newSet = new Set(prev);
                       newSet.delete(index);
                       return newSet;
                     });
                   }, 300); // Shorter delay since image is preloaded
                 } catch (error) {
                   // If preloading fails, still update the image
                   setGridImages(prev => {
                     const newGrid = [...prev];
                     newGrid[index] = newImage;
                     gridImagesRef.current = newGrid;
                     return newGrid;
                   });
                   
                   setTimeout(() => {
                     setFadingIndices(prev => {
                       const newSet = new Set(prev);
                       newSet.delete(index);
                       return newSet;
                     });
                   }, 300);
                 }
               }, 2000); // Wait for fade out to complete (matches CSS duration)
             }, staggerDelay);
           });
         
                    // Mark animation as complete
           animationTimeout = setTimeout(() => {
             isAnimating = false;
           }, (numToAnimate * 1200) + 4000); // Total animation time adjusted for new timing
       } else {
         // Reshuffle if not enough unique images
         const shuffled = [...backgroundImages].sort(() => Math.random() - 0.5);
         const newGrid = shuffled.slice(0, 18);
         setGridImages(newGrid);
         gridImagesRef.current = newGrid;
         isAnimating = false;
       }
     };

     // Start first animation after a delay
     const startTimeout = setTimeout(animateImages, 2000);
     
     // Repeat every 10 seconds
     const interval = setInterval(animateImages, 500);

     return () => {
       clearTimeout(startTimeout);
       clearInterval(interval);
       if (animationTimeout) {
         clearTimeout(animationTimeout);
       }
     };
   }, [backgroundImages]);

  // Face Detection Animation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setFaceDetectionStep(prev => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Archive Animation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setArchiveStep(prev => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Migration Animation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setMigrationStep(prev => (prev + 1) % 4);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Sharing Animation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setSharingStep(prev => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Deduplication Animation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setDeduplicationStep(prev => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.8; // Much stronger parallax speed
      const backgroundElement = document.querySelector('.parallax-bg') as HTMLElement;
      if (backgroundElement) {
        backgroundElement.style.transform = `translateY(${rate}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const animations = [
    {
      query: 'Alice reading book on bed',
      mainImage: '/alice-reading-book.jpg',
      suggestions: ['/alice-reading-book-2.jpg', '/alice-reading-book-3.jpg', '/alice-reading-book-4.jpg']
    },
    {
      query: 'Sid gardening',
      mainImage: '/gardning.jpeg',
      suggestions: ['/gardning-2.jpg', '/gardning-2.jpg', '/gardning.jpeg']
    },
    {
      query: 'Rachel driving car',
      mainImage: '/driving.jpeg',
      suggestions: ['/driving-2.jpg', '/driving.jpeg', '/driving-2.jpg']
    }
  ];

    // AI Search Animation - Smooth Looping
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep === 0) {
        // Move to typing step
        setCurrentStep(1);
             } else if (currentStep === 1 && isTypingComplete && !isDeleting) {
         // Only move to next step if typing is complete and not deleting
         // Don't move to step 2 here, let deletion handle it
      } else if (currentStep === 2) {
        // Reset to start the loop immediately after deletion
        setCurrentStep(0);
        setSearchQuery('');
        setShowSearchResults(false);
        setIsTypingComplete(false);
        setIsDeleting(false);
        deletionStartedRef.current = false;
        // Move to next animation
        setCurrentAnimation((prev) => (prev + 1) % animations.length);
      }
         }, currentStep === 0 ? 100 : (currentStep === 1 ? 100 : 1000));

    return () => clearTimeout(timer);
  }, [currentStep, currentAnimation, animations.length, isTypingComplete, isDeleting]);

    // Typing animation
  useEffect(() => {
    if (currentStep === 1 && !isTypingComplete && !isDeleting) {
      // Clear any existing interval
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      
      const query = animations[currentAnimation].query;
      let currentIndex = 0;
      
      typingIntervalRef.current = setInterval(() => {
        if (currentIndex < query.length) {
          setSearchQuery(query.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
          }
          setIsTypingComplete(true);
          // Show results after typing is complete
          setTimeout(() => {
            setShowSearchResults(true);
          }, 500);
                     // Start deletion after showing results
           setTimeout(() => {
             setIsDeleting(true);
           }, 4000);
        }
      }, 60);

      return () => {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
      };
    }
  }, [currentStep, currentAnimation, isTypingComplete, isDeleting]);

  // Delete animation
  useEffect(() => {
    if (isDeleting && isTypingComplete && !deletionStartedRef.current) {
      deletionStartedRef.current = true;
      
      // Clear any existing interval
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      
      const query = animations[currentAnimation].query;
      let currentIndex = query.length;
      
      typingIntervalRef.current = setInterval(() => {
        if (currentIndex > 0) {
          setSearchQuery(query.slice(0, currentIndex - 1));
          currentIndex--;
        } else {
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
          }
                     setIsDeleting(false);
           setSearchQuery('');
           setShowSearchResults(false);
           // Move to next step after deletion is complete
           setTimeout(() => {
             setCurrentStep(2);
           }, 100);
        }
      }, 30); // Fast deletion

      return () => {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
      };
    }
  }, [isDeleting, isTypingComplete, currentAnimation]);



  

  const futureFeatures = [
    {
      icon: <Video className="w-6 h-6" />,
      title: "AI Video Search",
      description: "Search through video content using AI-powered analysis"
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "Multi-Platform Migration",
      description: "Migrate from other storage services like Dropbox, OneDrive, and more"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
             {/* Hero Section */}
       <section className="relative h-screen overflow-hidden">
                             {/* Dynamic Grid Background with Parallax */}
           <div className="absolute inset-0 parallax-bg">
             <div 
               className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3 lg:gap-4 p-4 md:p-6 lg:p-8 min-h-screen"
               style={{
                 filter: 'blur(8px)',
                 transform: 'scale(1.1)'
               }}
             >
               {gridImages.map((image, index) => (
                 <div
                   key={`${image}-${index}`}
                   className={`relative aspect-square rounded-lg overflow-hidden transition-opacity duration-2000 ease-in-out ${
                     fadingIndices.has(index) ? 'opacity-0' : 'opacity-90'
                   }`}
                 >
                   <img
                     src={image}
                     alt={`Background ${index + 1}`}
                     className="w-full h-full object-cover"
                     style={{
                       transition: 'transform 0.1s ease-out'
                     }}
                   />
                 </div>
               ))}
             </div>
           </div>
           {/* Overlay for better text readability - moved outside parallax container */}
           <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60"></div>
         
         {/* Cross Lines Pattern Animation */}
         <div className="absolute inset-0 opacity-5">
           <div className="absolute inset-0" style={{
             backgroundImage: `
               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
               linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
             `,
             backgroundSize: '50px 50px',
             animation: 'moveLines 20s linear infinite'
           }}></div>
         </div>
         
                   <style>{`
            @font-face {
              font-family: 'Good Times';
              src: url('/Good Times Rg.otf') format('opentype');
              font-weight: normal;
              font-style: normal;
            }
            
            @keyframes moveLines {
              0% { transform: translate(0, 0); }
              100% { transform: translate(50px, 50px); }
            }
            
            .grid-background {
              position: relative;
              background-image: 
                linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
              background-size: 50px 50px;
              background-attachment: fixed;
            }
            
            .grid-background::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 100px;
              background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), transparent);
              pointer-events: none;
              z-index: 1;
            }
          `}</style>
         
         <div className="relative z-10 h-full flex items-center justify-center">
           <div className="text-center max-w-4xl mx-auto px-6">
             {/* Logo */}
                           <div className="mb-8">
                                                                 <img src="/VD Logo Funky.png" alt="Vamory Logo" className="w-48 h-48 lg:w-64 lg:h-64 xl:w-80 xl:h-80 object-contain mx-auto mb-1 drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]" />
                                                                                                                                   <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-light mb-4 tracking-[0.4em]">
                      <span className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]" style={{ fontFamily: 'Good Times' }}>
                        VAMORY
                      </span>
                    </h1>
                                                                                                                                   <p className="text-lg lg:text-xl text-white mb-8 max-w-xl mx-auto font-light tracking-wide uppercase">
                    <span className="inline-block px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
                      The next generation gallery
                    </span>
                   </p>
                   
                   {/* Call to Action Buttons */}
                   <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                     {isAuthenticated ? (
                       <Link
                         to="/gallery"
                         className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg"
                       >
                         <span>Go to Gallery</span>
                       </Link>
                     ) : (
                       <button
                         onClick={login}
                         className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg"
                       >
                         <LogIn className="w-5 h-5" />
                         <span>Get Started</span>
                       </button>
                     )}
                   </div>
              </div>
           </div>
         </div>
       </section>

                                                                                                               {/* AI Search Section */}
          <section className="py-24 bg-black relative transition-all duration-1000 grid-background">
           <div className="w-full px-6">
             <div className="text-center mb-16">
               <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
                 AI-Powered Search
               </h2>
                             <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                  Find your photos by describing what you see
                </p>
             </div>

             {/* AI Search Animation - Full Section */}
             <div className="w-full">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center lg:items-start">
                 {/* Left Side - Search Demo (Full Height) */}
                   <div className="h-full flex flex-col justify-center lg:justify-between lg:pr-12 lg:pl-16 text-center lg:text-left">
                                          {/* Search Bar Animation */}
                     <div className="relative mb-4 flex justify-center lg:justify-start w-full">
                       <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 w-full max-w-2xl mx-auto lg:mx-0 lg:max-w-none shadow-lg shadow-black/20">
                         <Search className="w-6 h-6 text-white/60 mr-4" />
                         <div className="flex-1 text-left">
                           <span className="text-white/80 text-lg">
                             {currentStep >= 1 ? searchQuery : ''}
                           </span>
                           {currentStep >= 1 && (
                             <span className="animate-pulse text-white">|</span>
                           )}
                         </div>
                       </div>
                     </div>

                                        {/* Search Results Animation */}
                     <div className={`space-y-6 transition-all duration-1000 ease-in-out ${showSearchResults ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4 pointer-events-none'} flex flex-col items-center lg:items-start w-full`}>
                       {/* Main Result */}
                       <div className="relative w-full max-w-2xl mx-auto lg:mx-0 lg:max-w-none">
                         <img 
                           src={animations[currentAnimation].mainImage}
                           alt="Search result" 
                           className="w-full h-full object-cover rounded-xl border border-white/20 shadow-2xl backdrop-blur-sm"
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl"></div>
                         <div className="absolute bottom-4 left-4 text-white text-lg font-medium">
                           {animations[currentAnimation].query}
                         </div>
                       </div>
                       
                       {/* Suggestions */}
                       <div className="grid grid-cols-3 gap-4 w-full max-w-2xl mx-auto lg:mx-0 lg:max-w-none">
                       {animations[currentAnimation].suggestions.map((image, index) => (
                         <img 
                           key={index}
                           src={image}
                           alt={`Suggestion ${index + 1}`}
                           className="w-full h-24 object-cover rounded-lg border border-white/20 opacity-60 backdrop-blur-sm shadow-md"
                         />
                       ))}
                     </div>
                   </div>
                 </div>

                 {/* Right Side - Search Examples and Features */}
                 <div className="space-y-12 lg:pr-16">
                                       {/* Search Examples */}
                    <div>
                      <h3 className="text-2xl font-semibold mb-6 text-white">Search Examples</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-lg shadow-black/20">
                          <div className="text-white/80 text-sm font-medium mb-2">Natural Language</div>
                          <div className="text-white text-lg">"Alice reading book on bed"</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-lg shadow-black/20">
                          <div className="text-white/80 text-sm font-medium mb-2">Object Description</div>
                          <div className="text-white text-lg">"Man wearing green t-shirt"</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-lg shadow-black/20">
                          <div className="text-white/80 text-sm font-medium mb-2">Activity Search</div>
                          <div className="text-white text-lg">"Sid gardening outside"</div>
                        </div>
                      </div>
                    </div>

                   {/* Powerful Features */}
                   <div>
                     <h3 className="text-2xl font-semibold mb-6 text-white">Powerful Features</h3>
                     <div className="space-y-6">
                       <div className="flex items-start space-x-4">
                         <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                           <Sparkles className="w-6 h-6 text-white" />
                         </div>
                         <div>
                           <h4 className="text-lg font-semibold text-white mb-2">Semantic Understanding</h4>
                           <p className="text-gray-400">AI understands context and meaning, not just keywords</p>
                         </div>
                       </div>
                       
                       <div className="flex items-start space-x-4">
                         <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                           <Search className="w-6 h-6 text-white" />
                         </div>
                         <div>
                           <h4 className="text-lg font-semibold text-white mb-2">Instant Results</h4>
                           <p className="text-gray-400">Get relevant results in milliseconds, not minutes</p>
                         </div>
                       </div>
                       
                       <div className="flex items-start space-x-4">
                         <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                           <Users className="w-6 h-6 text-white" />
                         </div>
                         <div>
                           <h4 className="text-lg font-semibold text-white mb-2">Face Recognition</h4>
                           <p className="text-gray-400">Find photos of specific people automatically</p>
                         </div>
                       </div>
                       
                       <div className="flex items-start space-x-4">
                         <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                           <FileCheck className="w-6 h-6 text-white" />
                         </div>
                         <div>
                           <h4 className="text-lg font-semibold text-white mb-2">Smart Categories</h4>
                           <p className="text-gray-400">Results organized by relevance and similarity</p>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </section>

                  {/* All Features Section */}
         <section className="py-24 bg-black relative transition-all duration-1000 grid-background">
           <div className="w-full px-6 lg:px-12">
             <div className="text-center mb-16">
               <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
                 Powerful Features
               </h2>
               <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                 Experience the full range of intelligent features that make Vamory the next generation gallery
               </p>
             </div>

             <div className="w-full">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                 {/* AI Face Detection */}
                 <div className="space-y-4">
                   <div className="text-center">
                     <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-lg flex items-center justify-center">
                       <Users className="w-8 h-8 text-white" />
                     </div>
                     <h3 className="text-xl font-semibold mb-2 text-white">AI Face Detection</h3>
                     <p className="text-gray-400 text-sm">Advanced facial recognition technology</p>
                   </div>
                   
                   {/* Face Detection Animation */}
                   <div className="relative w-full">
                     <div className="relative w-full h-56 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center shadow-lg shadow-black/20">
                       {/* Info Button */}
                       {expandedFeature !== 'face' && (
                         <button 
                           onClick={() => setExpandedFeature('face')}
                           className="absolute top-3 right-3 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                         >
                           <Info className="w-3 h-3 text-white" />
                         </button>
                       )}
                       
                       {/* Close Button */}
                       {expandedFeature === 'face' && (
                         <button 
                           onClick={() => setExpandedFeature(null)}
                           className="absolute top-3 right-3 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                         >
                           <X className="w-3 h-3 text-white" />
                         </button>
                       )}
                       
                       {/* Animation Content */}
                       {expandedFeature !== 'face' && (
                         <>
                           {/* Scanning Animation */}
                           {faceDetectionStep === 0 && (
                             <div className="text-center">
                               <div className="w-12 h-12 mx-auto mb-2 bg-white/20 rounded-lg flex items-center justify-center animate-pulse">
                                 <Search className="w-6 h-6 text-white" />
                               </div>
                               <p className="text-white text-sm font-medium">Scanning Image</p>
                               <p className="text-white/60 text-xs">Looking for faces...</p>
                             </div>
                           )}
                           
                           {/* Face Detection */}
                           {faceDetectionStep === 1 && (
                             <div className="text-center">
                               <div className="w-12 h-12 mx-auto mb-2 bg-green-500/20 rounded-lg flex items-center justify-center animate-pulse">
                                 <Users className="w-6 h-6 text-green-400" />
                               </div>
                               <p className="text-white text-sm font-medium">Face Found!</p>
                               <p className="text-white/60 text-xs">Processing...</p>
                             </div>
                           )}
                           
                           {/* Analysis Complete */}
                           {faceDetectionStep === 2 && (
                             <div className="text-center">
                               <div className="w-12 h-12 mx-auto mb-2 bg-green-500/20 rounded-lg flex items-center justify-center">
                                 <Users className="w-6 h-6 text-green-400" />
                               </div>
                               <p className="text-white text-sm font-medium">✓ Analysis Complete</p>
                               <p className="text-white/60 text-xs">Face tagged & indexed</p>
                             </div>
                           )}
                         </>
                       )}
                       
                       {/* Info Content */}
                       {expandedFeature === 'face' && (
                         <div className="text-center px-4">
                           <h4 className="text-sm font-semibold text-white mb-3">How it works:</h4>
                           <ul className="text-xs text-gray-300 space-y-2 text-left">
                             <li>• Automatically detects faces in uploaded photos</li>
                             <li>• Creates unique face signatures for each person</li>
                             <li>• Enables search by person name or description</li>
                             <li>• Groups photos by individual automatically</li>
                             <li>• Privacy-focused: all processing done locally</li>
                           </ul>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>

                 {/* Archive Folders */}
                 <div className="space-y-4">
                   <div className="text-center">
                     <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-lg flex items-center justify-center">
                       <Archive className="w-8 h-8 text-white" />
                     </div>
                     <h3 className="text-xl font-semibold mb-2 text-white">Archive Folders</h3>
                     <p className="text-gray-400 text-sm">Cost-effective long-term storage</p>
                   </div>
                   
                   {/* Archive Animation */}
                   <div className="relative w-full">
                     <div className="relative w-full h-56 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center shadow-lg shadow-black/20">
                       {/* Info Button */}
                       {expandedFeature !== 'archive' && (
                         <button 
                           onClick={() => setExpandedFeature('archive')}
                           className="absolute top-3 right-3 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                         >
                           <Info className="w-3 h-3 text-white" />
                         </button>
                       )}
                       
                       {/* Close Button */}
                       {expandedFeature === 'archive' && (
                         <button 
                           onClick={() => setExpandedFeature(null)}
                           className="absolute top-3 right-3 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                         >
                           <X className="w-3 h-3 text-white" />
                         </button>
                       )}
                       
                       {/* Animation Content */}
                       {expandedFeature !== 'archive' && (
                         <>
                           {/* Folder State */}
                           {archiveStep === 0 && (
                             <div className="text-center">
                               <div className="w-12 h-12 mx-auto mb-2 bg-white/20 rounded-lg flex items-center justify-center">
                                 <Archive className="w-6 h-6 text-white" />
                               </div>
                               <p className="text-white text-sm font-medium">Active Folder</p>
                               <p className="text-white/60 text-xs">Ready to archive</p>
                             </div>
                           )}
                           
                           {/* Archiving Animation */}
                           {archiveStep === 1 && (
                             <div className="text-center">
                               <div className="w-12 h-12 mx-auto mb-2 bg-white/20 rounded-lg flex items-center justify-center animate-pulse">
                                 <Archive className="w-6 h-6 text-white animate-spin" />
                               </div>
                               <p className="text-white text-sm font-medium">Moving to Archive</p>
                               <div className="w-32 h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                                 <div className="h-full bg-white/60 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                               </div>
                               <p className="text-white/60 text-xs mt-1">Saving 95% on storage</p>
                             </div>
                           )}
                           
                           {/* Archived State */}
                           {archiveStep === 2 && (
                             <div className="text-center">
                               <div className="w-12 h-12 mx-auto mb-2 bg-white/10 rounded-lg flex items-center justify-center">
                                 <Archive className="w-6 h-6 text-white/40" />
                               </div>
                               <p className="text-white/60 text-sm">✓ Archived</p>
                               <p className="text-white/40 text-xs">2-day access request</p>
                             </div>
                           )}
                         </>
                       )}
                       
                       {/* Info Content */}
                       {expandedFeature === 'archive' && (
                         <div className="text-center px-4">
                           <h4 className="text-sm font-semibold text-white mb-3">How it works:</h4>
                           <ul className="text-xs text-gray-300 space-y-2 text-left">
                             <li>• Move rarely accessed folders to archive storage</li>
                             <li>• Save up to 95% on storage costs</li>
                             <li>• Files remain accessible with 2-day request</li>
                             <li>• Automatic restoration when accessed</li>
                             <li>• Perfect for long-term photo preservation</li>
                           </ul>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>

                 {/* Google Drive Migration */}
                 <div className="space-y-4">
                   <div className="text-center">
                     <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-lg flex items-center justify-center">
                       <Cloud className="w-8 h-8 text-white" />
                     </div>
                     <h3 className="text-xl font-semibold mb-2 text-white">GDrive Migration</h3>
                     <p className="text-gray-400 text-sm">Seamless file transfer</p>
                   </div>
                   
                   {/* Migration Animation */}
                   <div className="relative w-full">
                     <div className="relative w-full h-56 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center shadow-lg shadow-black/20">
                       {/* Info Button */}
                       {expandedFeature !== 'migration' && (
                         <button 
                           onClick={() => setExpandedFeature('migration')}
                           className="absolute top-3 right-3 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                         >
                           <Info className="w-3 h-3 text-white" />
                         </button>
                       )}
                       
                       {/* Close Button */}
                       {expandedFeature === 'migration' && (
                         <button 
                           onClick={() => setExpandedFeature(null)}
                           className="absolute top-3 right-3 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                         >
                           <X className="w-3 h-3 text-white" />
                         </button>
                       )}
                       
                       {/* Animation Content */}
                       {expandedFeature !== 'migration' && (
                         <>
                           {/* Connect Step */}
                           {migrationStep === 0 && (
                             <div className="text-center">
                               <div className="w-12 h-12 mx-auto mb-2 bg-white/20 rounded-lg flex items-center justify-center">
                                 <Cloud className="w-6 h-6 text-white" />
                               </div>
                               <p className="text-white text-sm font-medium">Connecting to Drive</p>
                               <p className="text-white/60 text-xs">Authenticating...</p>
                             </div>
                           )}
                           
                           {/* Scanning Step */}
                           {migrationStep === 1 && (
                             <div className="text-center">
                               <div className="w-12 h-12 mx-auto mb-2 bg-white/20 rounded-lg flex items-center justify-center">
                                 <Search className="w-6 h-6 text-white animate-pulse" />
                               </div>
                               <p className="text-white text-sm font-medium">Scanning Files</p>
                               <div className="w-32 h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                                 <div className="h-full bg-white/60 rounded-full animate-pulse" style={{ width: '45%' }}></div>
                               </div>
                               <p className="text-white/60 text-xs mt-1">Found 1,247 files</p>
                             </div>
                           )}
                           
                           {/* Transfer Step */}
                           {migrationStep === 2 && (
                             <div className="text-center">
                               <div className="w-12 h-12 mx-auto mb-2 bg-white/20 rounded-lg flex items-center justify-center">
                                 <Cloud className="w-6 h-6 text-white animate-bounce" />
                               </div>
                               <p className="text-white text-sm font-medium">Transferring Files</p>
                               <div className="w-32 h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                                 <div className="h-full bg-white/60 rounded-full animate-pulse" style={{ width: '85%' }}></div>
                               </div>
                               <p className="text-white/60 text-xs mt-1">Moving to Vamory</p>
                             </div>
                           )}
                           
                           {/* Complete Step */}
                           {migrationStep === 3 && (
                             <div className="text-center">
                               <div className="w-12 h-12 mx-auto mb-2 bg-green-500/20 rounded-lg flex items-center justify-center">
                                 <FileCheck className="w-6 h-6 text-green-400" />
                               </div>
                               <p className="text-white text-sm font-medium">✓ Migration Complete!</p>
                               <p className="text-white/60 text-xs">All files transferred</p>
                             </div>
                           )}
                         </>
                       )}
                       
                       {/* Info Content */}
                       {expandedFeature === 'migration' && (
                         <div className="text-center px-4">
                           <h4 className="text-sm font-semibold text-white mb-3">How it works:</h4>
                           <ul className="text-xs text-gray-300 space-y-2 text-left">
                             <li>• One-click migration from Google Drive</li>
                             <li>• Preserves folder structure and organization</li>
                             <li>• Automatic duplicate detection during transfer</li>
                             <li>• Secure OAuth authentication</li>
                             <li>• Resume capability for large transfers</li>
                           </ul>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>

                 {/* Smart Sharing */}
                 <div className="space-y-4">
                   <div className="text-center">
                     <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-lg flex items-center justify-center">
                       <Share2 className="w-8 h-8 text-white" />
                     </div>
                     <h3 className="text-xl font-semibold mb-2 text-white">Smart Sharing</h3>
                     <p className="text-gray-400 text-sm">Public links & private invites</p>
                   </div>
                   
                   {/* Sharing Animation */}
                   <div className="relative w-full">
                     <div className="relative w-full h-56 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center shadow-lg shadow-black/20">
                       {/* Info Button */}
                       {expandedFeature !== 'sharing' && (
                         <button 
                           onClick={() => setExpandedFeature('sharing')}
                           className="absolute top-3 right-3 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                         >
                           <Info className="w-3 h-3 text-white" />
                         </button>
                       )}
                       
                       {/* Close Button */}
                       {expandedFeature === 'sharing' && (
                         <button 
                           onClick={() => setExpandedFeature(null)}
                           className="absolute top-3 right-3 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                         >
                           <X className="w-3 h-3 text-white" />
                         </button>
                       )}
                       
                       {/* Animation Content */}
                       {expandedFeature !== 'sharing' && (
                         <>
                           {/* Folder State */}
                           {sharingStep === 0 && (
                             <div className="text-center">
                               <div className="w-12 h-12 mx-auto mb-2 bg-white/20 rounded-lg flex items-center justify-center">
                                 <Archive className="w-6 h-6 text-white" />
                               </div>
                               <p className="text-white text-sm font-medium">Private Folder</p>
                               <p className="text-white/60 text-xs">Ready to share</p>
                             </div>
                           )}
                           
                           {/* Sharing Process */}
                           {sharingStep === 1 && (
                             <div className="text-center">
                               <div className="w-12 h-12 mx-auto mb-2 bg-white/20 rounded-lg flex items-center justify-center animate-pulse">
                                 <Share2 className="w-6 h-6 text-white" />
                               </div>
                               <p className="text-white text-sm font-medium">Creating Share Link</p>
                               <div className="mt-2 px-3 py-1 bg-white/10 rounded-lg">
                                 <p className="text-white/60 text-xs font-mono">vamory.com/share/abc123</p>
                               </div>
                               <p className="text-white/60 text-xs mt-1">Copy link to share</p>
                             </div>
                           )}
                           
                           {/* Shared State */}
                           {sharingStep === 2 && (
                             <div className="text-center">
                               <div className="w-12 h-12 mx-auto mb-2 bg-green-500/20 rounded-lg flex items-center justify-center">
                                 <Share2 className="w-6 h-6 text-green-400" />
                               </div>
                               <p className="text-white text-sm font-medium">✓ Link Active!</p>
                               <div className="flex space-x-1 justify-center mt-2">
                                 <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                 <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                 <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                               </div>
                               <p className="text-white/60 text-xs mt-1">Anyone can access</p>
                             </div>
                           )}
                         </>
                       )}
                       
                       {/* Info Content */}
                       {expandedFeature === 'sharing' && (
                         <div className="text-center px-4">
                           <h4 className="text-sm font-semibold text-white mb-3">How it works:</h4>
                           <ul className="text-xs text-gray-300 space-y-2 text-left">
                             <li>• Create public share links instantly</li>
                             <li>• Send private invitations to specific users</li>
                             <li>• Set view-only or edit permissions</li>
                             <li>• Track who has access to your folders</li>
                             <li>• Revoke access anytime with one click</li>
                           </ul>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>

                 {/* Smart Deduplication */}
                 <div className="space-y-4">
                   <div className="text-center">
                     <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-lg flex items-center justify-center">
                       <FileCheck className="w-8 h-8 text-white" />
                     </div>
                     <h3 className="text-xl font-semibold mb-2 text-white">Smart Deduplication</h3>
                     <p className="text-gray-400 text-sm">Automatic duplicate detection</p>
                   </div>
                   
                   {/* Deduplication Animation */}
                   <div className="relative w-full">
                     <div className="relative w-full h-56 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center shadow-lg shadow-black/20">
                       {/* Info Button */}
                       {expandedFeature !== 'deduplication' && (
                         <button 
                           onClick={() => setExpandedFeature('deduplication')}
                           className="absolute top-3 right-3 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                         >
                           <Info className="w-3 h-3 text-white" />
                         </button>
                       )}
                       
                       {/* Close Button */}
                       {expandedFeature === 'deduplication' && (
                         <button 
                           onClick={() => setExpandedFeature(null)}
                           className="absolute top-3 right-3 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                         >
                           <X className="w-3 h-3 text-white" />
                         </button>
                       )}
                       
                       {/* Animation Content */}
                       {expandedFeature !== 'deduplication' && (
                         <>
                           {/* Duplicate Detection */}
                           {deduplicationStep === 0 && (
                             <div className="text-center">
                               <div className="w-12 h-12 mx-auto mb-2 bg-white/20 rounded-lg flex items-center justify-center">
                                 <Search className="w-6 h-6 text-white animate-pulse" />
                               </div>
                               <p className="text-white text-sm font-medium">Scanning Library</p>
                               <div className="flex space-x-1 justify-center mt-2">
                                 <div className="w-6 h-6 bg-white/20 rounded"></div>
                                 <div className="w-6 h-6 bg-white/20 rounded"></div>
                                 <div className="w-6 h-6 bg-white/20 rounded"></div>
                               </div>
                               <p className="text-white/60 text-xs mt-1">Looking for duplicates...</p>
                             </div>
                           )}
                           
                           {/* Duplicate Found */}
                           {deduplicationStep === 1 && (
                             <div className="text-center">
                               <div className="w-12 h-12 mx-auto mb-2 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                                 <FileCheck className="w-6 h-6 text-yellow-400" />
                               </div>
                               <p className="text-white text-sm font-medium">Duplicate Detected!</p>
                               <div className="flex space-x-1 justify-center mt-2">
                                 <div className="w-6 h-6 bg-white/20 rounded"></div>
                                 <div className="w-6 h-6 bg-yellow-400/40 rounded border-2 border-yellow-400"></div>
                               </div>
                               <p className="text-white/60 text-xs mt-1">Skipping upload</p>
                             </div>
                           )}
                           
                           {/* Clean Library */}
                           {deduplicationStep === 2 && (
                             <div className="text-center">
                               <div className="w-12 h-12 mx-auto mb-2 bg-green-500/20 rounded-lg flex items-center justify-center">
                                 <FileCheck className="w-6 h-6 text-green-400" />
                               </div>
                               <p className="text-white text-sm font-medium">✓ Library Clean!</p>
                               <div className="flex space-x-1 justify-center mt-2">
                                 <div className="w-6 h-6 bg-white/20 rounded"></div>
                                 <div className="w-6 h-6 bg-white/20 rounded"></div>
                                 <div className="w-6 h-6 bg-white/20 rounded"></div>
                               </div>
                               <p className="text-white/60 text-xs mt-1">No duplicates found</p>
                             </div>
                           )}
                         </>
                       )}
                       
                       {/* Info Content */}
                       {expandedFeature === 'deduplication' && (
                         <div className="text-center px-4">
                           <h4 className="text-sm font-semibold text-white mb-3">How it works:</h4>
                           <ul className="text-xs text-gray-300 space-y-2 text-left">
                             <li>• Scans files using content-based hashing</li>
                             <li>• Detects exact and similar duplicates</li>
                             <li>• Prevents duplicate uploads automatically</li>
                             <li>• Saves storage space and keeps library clean</li>
                             <li>• Works with images, videos, and documents</li>
                           </ul>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>

                 {/* Multi Platform */}
                 <div className="space-y-4">
                   <div className="text-center">
                     <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-lg flex items-center justify-center">
                       <Database className="w-8 h-8 text-white" />
                     </div>
                     <h3 className="text-xl font-semibold mb-2 text-white">Multi Platform</h3>
                     <p className="text-gray-400 text-sm">Available on phone, web, Windows, Mac & more</p>
                   </div>
                   
                   {/* Multi Platform Animation */}
                   <div className="relative w-full">
                     <div className="relative w-full h-56 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center shadow-lg shadow-black/20">
                       {/* Info Button */}
                       {expandedFeature !== 'platform' && (
                         <button 
                           onClick={() => setExpandedFeature('platform')}
                           className="absolute top-3 right-3 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                         >
                           <Info className="w-3 h-3 text-white" />
                         </button>
                       )}
                       
                       {/* Close Button */}
                       {expandedFeature === 'platform' && (
                         <button 
                           onClick={() => setExpandedFeature(null)}
                           className="absolute top-3 right-3 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                         >
                           <X className="w-3 h-3 text-white" />
                         </button>
                       )}
                       
                       {/* Animation Content */}
                       {expandedFeature !== 'platform' && (
                         <div className="text-center">
                           <div className="flex space-x-2 justify-center mb-3">
                             <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                               <span className="text-white text-xs">📱</span>
                             </div>
                             <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                               <span className="text-white text-xs">💻</span>
                             </div>
                             <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                               <span className="text-white text-xs">🖥️</span>
                             </div>
                           </div>
                           <p className="text-white text-sm font-medium">Cross-Platform Sync</p>
                           <p className="text-white/60 text-xs">Access from anywhere</p>
                         </div>
                       )}
                       
                       {/* Info Content */}
                       {expandedFeature === 'platform' && (
                         <div className="text-center px-4">
                           <h4 className="text-sm font-semibold text-white mb-3">Available platforms:</h4>
                           <ul className="text-xs text-gray-300 space-y-2 text-left">
                             <li>• Web browser (Chrome, Safari, Firefox)</li>
                             <li>• iOS and Android mobile apps</li>
                             <li>• Windows desktop application</li>
                             <li>• macOS desktop application</li>
                             <li>• Linux desktop application</li>
                             <li>• Real-time sync across all devices</li>
                           </ul>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </section>









         {/* Coming Soon Section */}
         <section className="py-24 bg-black relative transition-all duration-1000 grid-background">
           <div className="w-full px-6">
             <div className="text-center mb-16">
               <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
                 Coming Soon
               </h2>
               <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                 Exciting new features on the horizon
               </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
               {futureFeatures.map((feature, index) => (
                 <div key={index} className="group p-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl hover:bg-white/15 transition-all duration-300 hover:transform hover:scale-105 shadow-lg shadow-black/20">
                   <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-white/20 to-gray-500/20 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                     <div className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                       {feature.icon}
                     </div>
                   </div>
                   <h4 className="text-xl font-semibold mb-4 text-white">{feature.title}</h4>
                   <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                 </div>
               ))}
             </div>
           </div>
         </section>

             
    </div>
  );
};

export default HomePage;
