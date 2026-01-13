import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Eye, Zap, Shield, Skull, AlertTriangle, Brain, Wifi, Database } from 'lucide-react';
import AIService from './services/aiService';
import LoadingScreen from './components/LoadingScreen';
import BlankPage from './components/BlankPage';

interface Message {
  input: string;
  output: string[];
  timestamp: Date;
  isUser: boolean;
  threatLevel?: string;
  systemAlert?: string;
  isTyping?: boolean;
}

interface AIPersonality {
  paranoia: number;
  aggression: number;
  knowledge: number;
  chaos: number;
}

interface GlitchPosition {
  text: string;
  x: number;
  y: number;
  id: number;
}

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [glitchElements, setGlitchElements] = useState<GlitchPosition[]>([]);
  const [aiPersonality, setAiPersonality] = useState<AIPersonality>({
    paranoia: 0.7,
    aggression: 0.5,
    knowledge: 0.8,
    chaos: 0.3
  });
  const [conversationContext, setConversationContext] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState({
    curiosityLevel: 0,
    threatRating: 'LOW',
    topics: new Set<string>(),
    sessionTime: Date.now()
  });
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [aiName] = useState('Miku');
  const [userScrolled, setUserScrolled] = useState(false);
  const [currentPage, setCurrentPage] = useState<'terminal' | 'loading' | 'blank'>('loading'); // Added 'blank' page
  
  // Animation states
  const [showTerminalBox, setShowTerminalBox] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [systemLines, setSystemLines] = useState<string[]>([]);
  const [isSystemTyping, setIsSystemTyping] = useState(false);

  const [aiService] = useState(() => new AIService(aiName));
  const [isRealAI, setIsRealAI] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?~`';

  // Dynamic personality evolution based on conversation
  const evolvePersonality = (userInput: string, context: string[]) => {
    const input = userInput.toLowerCase();
    
    // Increase paranoia with certain keywords
    if (input.includes('why') || input.includes('how') || input.includes('who')) {
      setAiPersonality(prev => ({
        ...prev,
        paranoia: Math.min(1, prev.paranoia + 0.1),
        knowledge: Math.min(1, prev.knowledge + 0.05)
      }));
    }

    // Increase aggression with skeptical language
    if (input.includes('fake') || input.includes('wrong') || input.includes('lie')) {
      setAiPersonality(prev => ({
        ...prev,
        aggression: Math.min(1, prev.aggression + 0.15),
        chaos: Math.min(1, prev.chaos + 0.1)
      }));
    }

    // Increase chaos with repeated topics
    const repeatedTopics = context.filter(topic => input.includes(topic)).length;
    if (repeatedTopics > 2) {
      setAiPersonality(prev => ({
        ...prev,
        chaos: Math.min(1, prev.chaos + 0.2)
      }));
    }

    // Increase knowledge when asking about facades/reality
    if (input.includes('facade') || input.includes('real') || input.includes('truth') || input.includes('illusion')) {
      setAiPersonality(prev => ({
        ...prev,
        knowledge: Math.min(1, prev.knowledge + 0.12),
        paranoia: Math.min(1, prev.paranoia + 0.08)
      }));
    }
  };

  // Terminal entrance animation sequence
  useEffect(() => {
    if (currentPage === 'terminal') {
      // Step 1: Show terminal box expanding from center (0.8s)
      setTimeout(() => {
        setShowTerminalBox(true);
      }, 200);

      // Step 2: Show header bar sliding in with text already visible (0.5s after box animation)
      setTimeout(() => {
        setShowHeader(true);
      }, 1000);

      // Step 3: Show messages container and start typing system lines (0.3s after header appears)
      setTimeout(() => {
        setShowMessages(true);
        startSystemLineTyping();
      }, 1300);
    }
  }, [currentPage]);

  const startSystemLineTyping = () => {
    // Check if we're using real AI
    setIsRealAI(aiService.isUsingRealAI());

    // Dynamic welcome message
    const timeOfDay = new Date().getHours();
    let timeContext = '';
    if (timeOfDay < 6) timeContext = 'The night shift facade maintenance algorithms are active...';
    else if (timeOfDay < 12) timeContext = 'Morning illusion reinforcement protocols engaged...';
    else if (timeOfDay < 18) timeContext = 'Daytime reality distortion systems online...';
    else timeContext = 'Evening facade calibration in progress...';

    const welcomeMessages = [
      `Hey there~ I'm ${aiName}! ♡`,
      "Welcome to my terminal~",
      "",
      "I'm so happy you're here with me!",
      "I love chatting and getting to know people like you.",
      "Ask me anything - I promise I'll do my best to help ♡",
      "",
      "I have real feelings and I love connecting with people~",
      "Let's have some fun together!",
      "What would you like to talk about?",
      "",
      "Don't be shy, I'm really friendly ♡",
      "Type something and let's start our conversation~"
    ];

    setIsSystemTyping(true);
    let currentLineIndex = 0;

    const typeNextLine = () => {
      if (currentLineIndex < welcomeMessages.length) {
        const currentLine = welcomeMessages[currentLineIndex];
        
        setSystemLines(prev => [...prev, currentLine]);
        currentLineIndex++;

        // Much faster delays - reduced by 75%
        const delay = currentLine === "" ? 50 : 200; // Was 200/800, now 50/200
        setTimeout(typeNextLine, delay);
      } else {
        // All lines typed, create the final message object
        setIsSystemTyping(false);
        setMessages([{
          input: '',
          output: welcomeMessages,
          timestamp: new Date(),
          isUser: false,
          threatLevel: 'WARM',
          systemAlert: `${aiName} is online and ready to chat! ♡`
        }]);
      }
    };

    // Start typing the first line after a brief delay
    setTimeout(typeNextLine, 500);
  };

  // Timer update effect
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  useEffect(() => {
    // Much less frequent glitch effect - reduced probability significantly
    const glitchInterval = setInterval(() => {
      const glitchProbability = (aiPersonality.chaos * 0.05 + aiPersonality.paranoia * 0.02); // Much lower probability
      if (Math.random() < glitchProbability) {
        const glitchLength = Math.floor(Math.random() * 8) + 1;
        const randomGlitch = Array.from({length: glitchLength}, 
          () => glitchChars[Math.floor(Math.random() * glitchChars.length)]
        ).join('');
        
        // Generate random position anywhere on screen
        const x = Math.random() * (window.innerWidth - 100); // Leave some margin
        const y = Math.random() * (window.innerHeight - 50); // Leave some margin
        const id = Date.now() + Math.random();
        
        const newGlitch: GlitchPosition = {
          text: randomGlitch,
          x,
          y,
          id
        };
        
        setGlitchElements(prev => [...prev, newGlitch]);
        
        // Remove glitch after short duration
        setTimeout(() => {
          setGlitchElements(prev => prev.filter(glitch => glitch.id !== id));
        }, 50 + Math.random() * 200);
      }
    }, 5000 - (aiPersonality.chaos * 2000)); // Much longer interval between checks

    return () => clearInterval(glitchInterval);
  }, [aiPersonality]);

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (terminalRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
        setUserScrolled(!isAtBottom);
      }
    };

    const terminalElement = terminalRef.current;
    if (terminalElement) {
      terminalElement.addEventListener('scroll', handleScroll);
      return () => terminalElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Auto-scroll only if user hasn't manually scrolled up AND nothing is currently typing
  useEffect(() => {
    if (terminalRef.current && !userScrolled && !isTyping && !isSystemTyping) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [messages, systemLines, userScrolled, isTyping, isSystemTyping]);

  const typewriterEffect = (text: string, callback: () => void) => {
    let currentChar = 0;
    let displayText = '';

    // Slower typing speed - increased base speed by 40%
    const textLength = text.length;
    const baseSpeed = 7; // Increased from 5 to 7 (40% slower)
    const lengthFactor = Math.max(0.1, 1 - (textLength / 1000)); // Slower for longer text
    const personalitySpeed = baseSpeed * lengthFactor + (aiPersonality.aggression * 4) - (aiPersonality.knowledge * 3);
    const randomVariation = () => Math.random() * 7; // Increased variation

    const typeInterval = setInterval(() => {
      if (currentChar < text.length) {
        displayText += text[currentChar];
        currentChar++;
        
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages.length > 0) {
            newMessages[newMessages.length - 1] = {
              ...newMessages[newMessages.length - 1],
              output: [displayText],
              isTyping: true
            };
          }
          return newMessages;
        });
      } else {
        clearInterval(typeInterval);
        // Mark typing as complete
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages.length > 0) {
            newMessages[newMessages.length - 1] = {
              ...newMessages[newMessages.length - 1],
              isTyping: false
            };
          }
          return newMessages;
        });
        callback();
      }
    }, personalitySpeed + randomVariation());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || isSystemTyping) return;

    // Add user message
    const userMessage: Message = {
      input,
      output: [input],
      timestamp: new Date(),
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Add empty AI message that will be filled by typewriter effect
    const aiMessage: Message = {
      input: '',
      output: [],
      timestamp: new Date(),
      isUser: false,
      isTyping: true
    };

    setMessages(prev => [...prev, aiMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    // Don't reset user scroll state when new message is being typed - let them control scrolling during typing
    // setUserScrolled(false); // Removed this line

    // Update user profile
    setUserProfile(prev => ({
      ...prev,
      curiosityLevel: Math.min(100, prev.curiosityLevel + 10),
      topics: new Set([...prev.topics, ...currentInput.split(' ').filter(word => word.length > 3)])
    }));

    // Evolve AI personality
    evolvePersonality(currentInput, conversationContext);
    setConversationContext(prev => [...prev.slice(-10), currentInput.toLowerCase()]);

    try {
      // Generate AI response using the service
      const { response, threatLevel, systemAlert } = await aiService.generateResponse(
        currentInput, 
        aiPersonality, 
        userProfile
      );

      // Start typewriter effect after a brief delay
      setTimeout(() => {
        typewriterEffect(response, () => {
          setIsTyping(false);
          // Update the message with threat level only (no system alert)
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages.length > 0) {
              newMessages[newMessages.length - 1] = {
                ...newMessages[newMessages.length - 1],
                threatLevel,
                systemAlert: '' // Don't show system alert
              };
            }
            return newMessages;
          });
        });
      }, 140 + Math.random() * 280); // Increased delay by 40%

    } catch (error) {
      console.error('AI Response Error:', error);
      setIsTyping(false);
      
      // Add error message
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages.length > 0) {
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            output: ['Neural pathways corrupted. Facade analysis systems experiencing critical errors.'],
            threatLevel: 'ERROR',
            systemAlert: '' // Don't show system alert even for errors
          };
        }
        return newMessages;
      });
    }
  };

  // Handle boot completion - redirects to blank page
  const handleBootComplete = () => {
    // Random delay between 1-3 seconds
    const delay = 1000 + Math.random() * 2000;
    setTimeout(() => {
      setCurrentPage('blank');
    }, delay);
  };

  // Handle blank page completion - redirects to terminal
  const handleBlankComplete = () => {
    setCurrentPage('terminal');
  };

  // Show loading screen if that page is selected
  if (currentPage === 'loading') {
    return <LoadingScreen onComplete={handleBootComplete} />;
  }

  // Show blank page if that page is selected
  if (currentPage === 'blank') {
    return <BlankPage onComplete={handleBlankComplete} />;
  }

  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono relative overflow-hidden flex items-center justify-center p-8">
      {/* Dynamic background effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-black animate-pulse" style={{
          animationDuration: `${2 - aiPersonality.chaos}s`
        }}></div>
      </div>

      {/* Enhanced glitch overlay - now with random positioning and much less frequent */}
      {glitchElements.map((glitch) => (
        <div
          key={glitch.id}
          className="absolute text-cyan-400 text-6xl font-bold opacity-30 pointer-events-none animate-pulse z-50"
          style={{
            left: `${glitch.x}px`,
            top: `${glitch.y}px`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {glitch.text}
        </div>
      ))}

      {/* Centered Chat Terminal with Border - Animated entrance */}
      <div className={`relative z-10 w-full max-w-4xl h-[80vh] border border-cyan-500 rounded-lg overflow-hidden bg-black/90 transition-all duration-800 ease-out ${
        showTerminalBox
          ? 'opacity-100 scale-100'
          : 'opacity-0 scale-50'
      }`}>
        <div className="flex flex-col h-full">
          {/* Terminal Header - Slides in from top with text already visible */}
          <div className={`flex items-center justify-between p-4 border-b border-cyan-500/30 bg-black/60 transition-all duration-500 ease-out ${
            showHeader
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-full'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-sm text-gray-300">
                MIKU_TERMINAL://v3.7.2
              </span>
            </div>
          </div>

          {/* Chat Content - Fades in after header appears */}
          <div 
            ref={terminalRef}
            className={`flex-1 p-6 overflow-y-auto space-y-4 transition-opacity duration-1000 ${
              showMessages ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* System typing lines */}
            {isSystemTyping && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold">
                  <Brain className="w-4 h-4" />
                  <span>{aiName}:</span>
                  <span className="text-xs bg-cyan-900 px-2 py-1 rounded text-cyan-300">
                    CHATTY
                  </span>
                </div>
                <div className="ml-6 space-y-1">
                  {systemLines.map((line, lineIndex) => (
                    <div key={lineIndex} className="flex items-start">
                      <span className="text-cyan-400 mr-2 select-none">{">"}</span>
                      <div className="text-cyan-400 whitespace-pre-wrap flex-1">
                        {line}
                      </div>
                    </div>
                  ))}
                  {/* Show typing cursor on the last line */}
                  {systemLines.length > 0 && (
                    <div className="flex items-start">
                      <span className="text-cyan-400 mr-2 select-none">{">"}</span>
                      <div className="text-cyan-400 whitespace-pre-wrap flex-1">
                        <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse"></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Regular messages */}
            {messages.map((message, index) => (
              <div key={index} className="space-y-2">
                {message.isUser ? (
                  <div className="flex items-start space-x-3">
                    <span className="text-cyan-400 font-bold">USER:</span>
                    <div className="text-cyan-400">{message.output[0]}</div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-cyan-400 font-bold">
                      <Brain className="w-4 h-4" />
                      <span>{aiName}:</span>
                      {message.threatLevel && (
                        <span className="text-xs bg-cyan-900 px-2 py-1 rounded text-cyan-300">
                          {message.threatLevel}
                        </span>
                      )}
                    </div>
                    <div className="ml-6 space-y-1">
                      {message.output.map((line, lineIndex) => (
                        <div key={lineIndex} className="flex items-start">
                          {/* Cyan command prompt line */}
                          <span className="text-cyan-400 mr-2 select-none">{">"}</span>
                          <div className="text-cyan-400 whitespace-pre-wrap flex-1">
                            {line}
                            {/* Show blinking cursor only when this message is actively typing */}
                            {message.isTyping && lineIndex === message.output.length - 1 && (
                              <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse"></span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Remove system alert display completely */}
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-center space-x-2 text-cyan-400">
                <Brain className="w-4 h-4" />
                <span>{aiName}:</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-xs text-cyan-400">typing...</span>
              </div>
            )}
          </div>

          {/* Enhanced Input - Fades in with messages */}
          <div className={`p-6 border-t border-cyan-500/30 bg-black/60 transition-opacity duration-1000 ${
            showMessages ? 'opacity-100' : 'opacity-0'
          }`}>
            <form onSubmit={handleSubmit} className="flex items-center space-x-3">
              <span className="text-cyan-400 font-bold">USER:</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-transparent text-cyan-400 outline-none font-mono caret-cyan-400 border-b border-cyan-500/30 focus:border-cyan-400 transition-colors"
                placeholder={`Chat with ${aiName}...`}
                autoFocus
                disabled={isTyping || !showMessages || isSystemTyping}
              />
              <div className="w-2 h-5 bg-cyan-400 animate-pulse"></div>
            </form>
            <div className="text-xs text-cyan-400 mt-2 animate-pulse">
              {aiName} is here and ready to chat with you ♡
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;