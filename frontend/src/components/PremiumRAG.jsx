import React, { useState, useRef, useEffect } from 'react';
import { Send, Menu, X, Upload, FileText, Cpu, Terminal, Maximize2, Circle, Trash2, Palette } from 'lucide-react';
import { askQuestion, uploadFile, getFiles } from '../services/api';

export default function NeuralRAGChat() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showColorPanel, setShowColorPanel] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('cyberpunk');
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing files on component mount
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await getFiles();
      const files = response.files.map((file, idx) => ({
        id: idx,
        name: file.filename,
        size: file.size
      }));
      setUploadedFiles(files);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage = {
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages([...messages, userMessage]);
    const question = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await askQuestion(question);
      
      const aiMessage = {
        type: 'ai',
        content: response.answer || 'No answer received',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        type: 'ai',
        content: `Error: ${error.response?.data?.error || error.message || 'Failed to get response from server'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error('Error asking question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (files) => {
    const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length === 0) {
      alert('Please upload PDF files only');
      return;
    }

    setIsUploading(true);

    for (const file of pdfFiles) {
      try {
        const response = await uploadFile(file, false);
        console.log('Upload response:', response);
        
        // Add file to the list
        setUploadedFiles(prev => [...prev, {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size
        }]);
      } catch (error) {
        console.error('Error uploading file:', error);
        alert(`Failed to upload ${file.name}: ${error.response?.data?.error || error.message}`);
      }
    }

    setIsUploading(false);
    await loadFiles(); // Refresh file list
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const removeFile = (id) => {
    // Note: This only removes from UI, not from backend
    setUploadedFiles(uploadedFiles.filter(file => file.id !== id));
  };

  const formatFileSize = (bytes) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const getThemeClasses = () => {
    const themes = {
      cyberpunk: 'theme-cyberpunk',
      neon: 'theme-neon',
      sunset: 'theme-sunset',
      ocean: 'theme-ocean',
      forest: 'theme-forest',
      cosmic: 'theme-cosmic',
      matrix: 'theme-matrix',
      sakura: 'theme-sakura'
    };
    return themes[currentTheme];
  };

  return (
    <div className={`flex h-screen text-white overflow-hidden ${getThemeClasses()}`}>
      {/* Color Theme Panel */}
      {showColorPanel && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900/95 border border-white/10 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                Choose Your Theme 🎨
              </h2>
              <button 
                onClick={() => setShowColorPanel(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ThemeCard name="🌃 Cyberpunk" theme="cyberpunk" current={currentTheme} onClick={setCurrentTheme} onClose={() => setShowColorPanel(false)} />
              <ThemeCard name="⚡ Neon Dreams" theme="neon" current={currentTheme} onClick={setCurrentTheme} onClose={() => setShowColorPanel(false)} />
              <ThemeCard name="🌅 Sunset Vibes" theme="sunset" current={currentTheme} onClick={setCurrentTheme} onClose={() => setShowColorPanel(false)} />
              <ThemeCard name="🌊 Deep Ocean" theme="ocean" current={currentTheme} onClick={setCurrentTheme} onClose={() => setShowColorPanel(false)} />
              <ThemeCard name="🌲 Forest Night" theme="forest" current={currentTheme} onClick={setCurrentTheme} onClose={() => setShowColorPanel(false)} />
              <ThemeCard name="✨ Cosmic Purple" theme="cosmic" current={currentTheme} onClick={setCurrentTheme} onClose={() => setShowColorPanel(false)} />
              <ThemeCard name="💚 Matrix Code" theme="matrix" current={currentTheme} onClick={setCurrentTheme} onClose={() => setShowColorPanel(false)} />
              <ThemeCard name="🌸 Sakura Pink" theme="sakura" current={currentTheme} onClick={setCurrentTheme} onClose={() => setShowColorPanel(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 ease-in-out sidebar-bg backdrop-blur-xl border-r border-color flex flex-col overflow-hidden`}>
        <div className="p-6 border-b border-color">
          <h2 className="text-xl font-bold gradient-text mb-4">
            Knowledge Base
          </h2>
          
          {/* Upload Button */}
          <div 
            className={`relative border-2 border-dashed ${isDragging ? 'border-primary bg-primary/10' : 'border-color'} rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <Upload className={`mx-auto mb-2 text-primary ${isUploading ? 'animate-pulse' : 'group-hover:scale-110'} transition-transform`} size={32} />
            <p className="text-sm text-primary font-semibold">
              {isUploading ? 'UPLOADING...' : 'ADD DOCUMENT'}
            </p>
            <p className="text-xs text-primary/60 mt-1">Drag & drop PDF files</p>
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept=".pdf"
              multiple
              disabled={isUploading}
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="text-xs text-primary/60 mb-2 px-2">
            {uploadedFiles.length} document{uploadedFiles.length !== 1 ? 's' : ''} loaded
          </div>
          {uploadedFiles.map((file) => (
            <div 
              key={file.id}
              className="flex items-center gap-3 p-3 rounded-lg file-card border border-color hover:border-primary/40 hover:shadow-lg glow-shadow transition-all group"
            >
              <FileText className="text-primary group-hover:scale-110 transition-transform flex-shrink-0" size={20} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/90 truncate">{file.name}</p>
                <p className="text-xs text-primary/60">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
              >
                <Trash2 size={16} className="text-red-400" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-color space-y-2">
          <button
            onClick={() => setShowColorPanel(true)}
            className="w-full p-3 rounded-lg file-card border border-color hover:border-primary/40 transition-all hover:scale-105 font-semibold text-primary flex items-center justify-center gap-2"
          >
            <Palette size={20} />
            Change Theme
          </button>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-primary/80">Engine: <span className="text-white/90 font-semibold">Ollama</span></span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-primary/80">Vector DB: <span className="text-white/90 font-semibold">ChromaDB</span></span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="sidebar-bg backdrop-blur-xl border-b border-color px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-all hover:scale-105"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-3">
              <Circle className="text-green-400 fill-green-400 animate-pulse" size={12} />
              <span className="text-sm font-semibold gradient-text">
                Neural Session: Active
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Terminal className="text-primary cursor-pointer hover:opacity-70 transition-colors" size={20} />
            <Maximize2 className="text-primary cursor-pointer hover:opacity-70 transition-colors" size={20} />
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center animate-fade-in">
                <div className="text-6xl mb-4 animate-pulse">🧠</div>
                <h3 className="text-2xl font-bold gradient-text mb-2">
                  How can I assist?
                </h3>
                <p className="text-primary/60">Query your knowledge base to get started</p>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 animate-fade-up ${msg.type === 'user' ? 'justify-end' : ''}`}>
              {msg.type === 'ai' && (
                <div className="w-10 h-10 rounded-full ai-avatar flex items-center justify-center flex-shrink-0 shadow-lg glow-shadow">
                  <Cpu size={20} />
                </div>
              )}
              
              <div className={`max-w-2xl ${msg.type === 'user' ? 'order-1' : ''}`}>
                <div className={`p-4 rounded-2xl ${
                  msg.type === 'user' 
                    ? 'user-message shadow-lg user-glow' 
                    : 'ai-message backdrop-blur-xl border border-color'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {msg.sources.map((source, i) => (
                      <span key={i} className="text-xs px-3 py-1 rounded-full file-card border border-color flex items-center gap-1">
                        <FileText size={12} />
                        {source.name}
                        <span className="text-green-400 font-semibold ml-1">{source.confidence}%</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {msg.type === 'user' && (
                <div className="w-10 h-10 rounded-full user-avatar flex items-center justify-center flex-shrink-0 shadow-lg user-glow order-2">
                  <span className="text-sm font-bold">U</span>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4 animate-fade-up">
              <div className="w-10 h-10 rounded-full ai-avatar flex items-center justify-center flex-shrink-0 shadow-lg glow-shadow animate-pulse">
                <Cpu size={20} />
              </div>
              <div className="p-4 rounded-2xl ai-message backdrop-blur-xl border border-color">
                <p className="text-sm text-primary">
                  Synthesizing<span className="animate-pulse">...</span>
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="p-6">
          <div className="relative group">
            <div className="absolute -inset-1 gradient-bg rounded-2xl blur opacity-0 group-focus-within:opacity-75 transition-opacity"></div>
            <div className="relative flex items-center gap-3 input-bg backdrop-blur-xl border border-color rounded-2xl p-2 focus-within:border-primary/50 transition-all">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Query your database..."
                className="flex-1 bg-transparent px-4 py-3 outline-none placeholder-primary/40 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="p-3 rounded-xl send-button disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 hover:shadow-lg user-glow"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Cyberpunk Theme */
        .theme-cyberpunk {
          background: linear-gradient(to bottom right, #0f172a, #1e293b, #064e3b);
        }
        .theme-cyberpunk .sidebar-bg { background: rgba(2, 6, 23, 0.9); }
        .theme-cyberpunk .border-color { border-color: rgba(16, 185, 129, 0.2); }
        .theme-cyberpunk .text-primary { color: #34d399; }
        .theme-cyberpunk .gradient-text { 
          background: linear-gradient(to right, #34d399, #14b8a6);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .theme-cyberpunk .gradient-bg { background: linear-gradient(to right, #059669, #0d9488); }
        .theme-cyberpunk .file-card { background: linear-gradient(to right, rgba(16, 185, 129, 0.1), rgba(20, 184, 166, 0.1)); }
        .theme-cyberpunk .glow-shadow { box-shadow: 0 0 20px rgba(16, 185, 129, 0.2); }
        .theme-cyberpunk .ai-avatar { background: linear-gradient(to bottom right, #10b981, #14b8a6); }
        .theme-cyberpunk .user-avatar { background: linear-gradient(to bottom right, #ea580c, #f59e0b); }
        .theme-cyberpunk .user-message { background: linear-gradient(to right, #ea580c, #f59e0b); }
        .theme-cyberpunk .user-glow { box-shadow: 0 0 20px rgba(234, 88, 12, 0.3); }
        .theme-cyberpunk .ai-message { background: rgba(2, 6, 23, 0.6); }
        .theme-cyberpunk .input-bg { background: rgba(2, 6, 23, 0.8); }
        .theme-cyberpunk .send-button { background: linear-gradient(to right, #ea580c, #f59e0b); }
        .theme-cyberpunk .hover\\:border-primary:hover { border-color: rgba(52, 211, 153, 0.4); }

        /* Neon Dreams Theme */
        .theme-neon {
          background: linear-gradient(to bottom right, #312e81, #581c87, #831843);
        }
        .theme-neon .sidebar-bg { background: rgba(0, 0, 0, 0.9); }
        .theme-neon .border-color { border-color: rgba(236, 72, 153, 0.2); }
        .theme-neon .text-primary { color: #f472b6; }
        .theme-neon .gradient-text { 
          background: linear-gradient(to right, #f472b6, #e879f9);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .theme-neon .gradient-bg { background: linear-gradient(to right, #db2777, #c026d3); }
        .theme-neon .file-card { background: linear-gradient(to right, rgba(236, 72, 153, 0.1), rgba(232, 121, 249, 0.1)); }
        .theme-neon .glow-shadow { box-shadow: 0 0 20px rgba(236, 72, 153, 0.2); }
        .theme-neon .ai-avatar { background: linear-gradient(to bottom right, #ec4899, #e879f9); }
        .theme-neon .user-avatar { background: linear-gradient(to bottom right, #06b6d4, #3b82f6); }
        .theme-neon .user-message { background: linear-gradient(to right, #0891b2, #2563eb); }
        .theme-neon .user-glow { box-shadow: 0 0 20px rgba(6, 182, 212, 0.3); }
        .theme-neon .ai-message { background: rgba(0, 0, 0, 0.6); }
        .theme-neon .input-bg { background: rgba(0, 0, 0, 0.8); }
        .theme-neon .send-button { background: linear-gradient(to right, #0891b2, #2563eb); }
        .theme-neon .hover\\:border-primary:hover { border-color: rgba(244, 114, 182, 0.4); }

        /* Sunset Theme */
        .theme-sunset {
          background: linear-gradient(to bottom right, #881337, #9a3412, #78350f);
        }
        .theme-sunset .sidebar-bg { background: rgba(0, 0, 0, 0.9); }
        .theme-sunset .border-color { border-color: rgba(251, 146, 60, 0.2); }
        .theme-sunset .text-primary { color: #fb923c; }
        .theme-sunset .gradient-text { 
          background: linear-gradient(to right, #fb923c, #fb7185);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .theme-sunset .gradient-bg { background: linear-gradient(to right, #ea580c, #e11d48); }
        .theme-sunset .file-card { background: linear-gradient(to right, rgba(251, 146, 60, 0.1), rgba(251, 113, 133, 0.1)); }
        .theme-sunset .glow-shadow { box-shadow: 0 0 20px rgba(251, 146, 60, 0.2); }
        .theme-sunset .ai-avatar { background: linear-gradient(to bottom right, #f97316, #f43f5e); }
        .theme-sunset .user-avatar { background: linear-gradient(to bottom right, #7c3aed, #a855f7); }
        .theme-sunset .user-message { background: linear-gradient(to right, #7c3aed, #9333ea); }
        .theme-sunset .user-glow { box-shadow: 0 0 20px rgba(124, 58, 237, 0.3); }
        .theme-sunset .ai-message { background: rgba(0, 0, 0, 0.6); }
        .theme-sunset .input-bg { background: rgba(0, 0, 0, 0.8); }
        .theme-sunset .send-button { background: linear-gradient(to right, #7c3aed, #9333ea); }
        .theme-sunset .hover\\:border-primary:hover { border-color: rgba(251, 146, 60, 0.4); }

        /* Ocean Theme */
        .theme-ocean {
          background: linear-gradient(to bottom right, #020617, #1e3a8a, #115e59);
        }
        .theme-ocean .sidebar-bg { background: rgba(2, 6, 23, 0.9); }
        .theme-ocean .border-color { border-color: rgba(34, 211, 238, 0.2); }
        .theme-ocean .text-primary { color: #22d3ee; }
        .theme-ocean .gradient-text { 
          background: linear-gradient(to right, #22d3ee, #3b82f6);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .theme-ocean .gradient-bg { background: linear-gradient(to right, #0891b2, #2563eb); }
        .theme-ocean .file-card { background: linear-gradient(to right, rgba(34, 211, 238, 0.1), rgba(59, 130, 246, 0.1)); }
        .theme-ocean .glow-shadow { box-shadow: 0 0 20px rgba(34, 211, 238, 0.2); }
        .theme-ocean .ai-avatar { background: linear-gradient(to bottom right, #06b6d4, #3b82f6); }
        .theme-ocean .user-avatar { background: linear-gradient(to bottom right, #14b8a6, #10b981); }
        .theme-ocean .user-message { background: linear-gradient(to right, #14b8a6, #059669); }
        .theme-ocean .user-glow { box-shadow: 0 0 20px rgba(20, 184, 166, 0.3); }
        .theme-ocean .ai-message { background: rgba(2, 6, 23, 0.6); }
        .theme-ocean .input-bg { background: rgba(2, 6, 23, 0.8); }
        .theme-ocean .send-button { background: linear-gradient(to right, #14b8a6, #059669); }
        .theme-ocean .hover\\:border-primary:hover { border-color: rgba(34, 211, 238, 0.4); }

        /* Forest Theme */
        .theme-forest {
          background: linear-gradient(to bottom right, #020617, #14532d, #3f6212);
        }
        .theme-forest .sidebar-bg { background: rgba(0, 0, 0, 0.9); }
        .theme-forest .border-color { border-color: rgba(132, 204, 22, 0.2); }
        .theme-forest .text-primary { color: #84cc16; }
        .theme-forest .gradient-text { 
          background: linear-gradient(to right, #84cc16, #22c55e);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .theme-forest .gradient-bg { background: linear-gradient(to right, #65a30d, #16a34a); }
        .theme-forest .file-card { background: linear-gradient(to right, rgba(132, 204, 22, 0.1), rgba(34, 197, 94, 0.1)); }
        .theme-forest .glow-shadow { box-shadow: 0 0 20px rgba(132, 204, 22, 0.2); }
        .theme-forest .ai-avatar { background: linear-gradient(to bottom right, #84cc16, #22c55e); }
        .theme-forest .user-avatar { background: linear-gradient(to bottom right, #eab308, #f59e0b); }
        .theme-forest .user-message { background: linear-gradient(to right, #ca8a04, #d97706); }
        .theme-forest .user-glow { box-shadow: 0 0 20px rgba(234, 179, 8, 0.3); }
        .theme-forest .ai-message { background: rgba(0, 0, 0, 0.6); }
        .theme-forest .input-bg { background: rgba(0, 0, 0, 0.8); }
        .theme-forest .send-button { background: linear-gradient(to right, #ca8a04, #d97706); }
        .theme-forest .hover\\:border-primary:hover { border-color: rgba(132, 204, 22, 0.4); }

        /* Cosmic Theme */
        .theme-cosmic {
          background: linear-gradient(to bottom right, #4c1d95, #581c87, #4338ca);
        }
        .theme-cosmic .sidebar-bg { background: rgba(0, 0, 0, 0.9); }
        .theme-cosmic .border-color { border-color: rgba(139, 92, 246, 0.2); }
        .theme-cosmic .text-primary { color: #a78bfa; }
        .theme-cosmic .gradient-text { 
          background: linear-gradient(to right, #a78bfa, #c084fc);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .theme-cosmic .gradient-bg { background: linear-gradient(to right, #7c3aed, #9333ea); }
        .theme-cosmic .file-card { background: linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(192, 132, 252, 0.1)); }
        .theme-cosmic .glow-shadow { box-shadow: 0 0 20px rgba(139, 92, 246, 0.2); }
        .theme-cosmic .ai-avatar { background: linear-gradient(to bottom right, #8b5cf6, #a855f7); }
        .theme-cosmic .user-avatar { background: linear-gradient(to bottom right, #f43f5e, #ec4899); }
        .theme-cosmic .user-message { background: linear-gradient(to right, #e11d48, #db2777); }
        .theme-cosmic .user-glow { box-shadow: 0 0 20px rgba(244, 63, 94, 0.3); }
        .theme-cosmic .ai-message { background: rgba(0, 0, 0, 0.6); }
        .theme-cosmic .input-bg { background: rgba(0, 0, 0, 0.8); }
        .theme-cosmic .send-button { background: linear-gradient(to right, #e11d48, #db2777); }
        .theme-cosmic .hover\\:border-primary:hover { border-color: rgba(167, 139, 250, 0.4); }

        /* Matrix Theme */
        .theme-matrix {
          background: linear-gradient(to bottom right, #000000, #030712, #14532d);
        }
        .theme-matrix .sidebar-bg { background: rgba(0, 0, 0, 0.95); }
        .theme-matrix .border-color { border-color: rgba(34, 197, 94, 0.2); }
        .theme-matrix .text-primary { color: #22c55e; }
        .theme-matrix .gradient-text { 
          background: linear-gradient(to right, #22c55e, #84cc16);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .theme-matrix .gradient-bg { background: linear-gradient(to right, #16a34a, #65a30d); }
        .theme-matrix .file-card { background: linear-gradient(to right, rgba(34, 197, 94, 0.1), rgba(132, 204, 22, 0.1)); }
        .theme-matrix .glow-shadow { box-shadow: 0 0 20px rgba(34, 197, 94, 0.2); }
        .theme-matrix .ai-avatar { background: linear-gradient(to bottom right, #22c55e, #84cc16); }
        .theme-matrix .user-avatar { background: linear-gradient(to bottom right, #10b981, #14b8a6); }
        .theme-matrix .user-message { background: linear-gradient(to right, #059669, #0d9488); }
        .theme-matrix .user-glow { box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
        .theme-matrix .ai-message { background: rgba(0, 0, 0, 0.6); }
        .theme-matrix .input-bg { background: rgba(0, 0, 0, 0.8); }
        .theme-matrix .send-button { background: linear-gradient(to right, #059669, #0d9488); }
        .theme-matrix .hover\\:border-primary:hover { border-color: rgba(34, 197, 94, 0.4); }

        /* Sakura Theme */
        .theme-sakura {
          background: linear-gradient(to bottom right, #831843, #881337, #581c87);
        }
        .theme-sakura .sidebar-bg { background: rgba(0, 0, 0, 0.9); }
        .theme-sakura .border-color { border-color: rgba(244, 114, 182, 0.2); }
        .theme-sakura .text-primary { color: #f9a8d4; }
        .theme-sakura .gradient-text { 
          background: linear-gradient(to right, #f9a8d4, #fda4af);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .theme-sakura .gradient-bg { background: linear-gradient(to right, #ec4899, #f43f5e); }
        .theme-sakura .file-card { background: linear-gradient(to right, rgba(249, 168, 212, 0.1), rgba(253, 164, 175, 0.1)); }
        .theme-sakura .glow-shadow { box-shadow: 0 0 20px rgba(244, 114, 182, 0.2); }
        .theme-sakura .ai-avatar { background: linear-gradient(to bottom right, #ec4899, #f43f5e); }
        .theme-sakura .user-avatar { background: linear-gradient(to bottom right, #a855f7, #8b5cf6); }
        .theme-sakura .user-message { background: linear-gradient(to right, #9333ea, #7c3aed); }
        .theme-sakura .user-glow { box-shadow: 0 0 20px rgba(168, 85, 247, 0.3); }
        .theme-sakura .ai-message { background: rgba(0, 0, 0, 0.6); }
        .theme-sakura .input-bg { background: rgba(0, 0, 0, 0.8); }
        .theme-sakura .send-button { background: linear-gradient(to right, #9333ea, #7c3aed); }
        .theme-sakura .hover\\:border-primary:hover { border-color: rgba(249, 168, 212, 0.4); }
        
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-fade-up {
          animation: fade-up 0.5s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  );
}

function ThemeCard({ name, theme, current, onClick, onClose }) {
  const previews = {
    cyberpunk: { bg: 'from-slate-900 via-slate-800 to-emerald-900', c1: 'from-emerald-400 to-teal-400', c2: 'from-orange-600 to-amber-600' },
    neon: { bg: 'from-indigo-950 via-purple-950 to-pink-950', c1: 'from-pink-400 to-fuchsia-400', c2: 'from-cyan-600 to-blue-600' },
    sunset: { bg: 'from-rose-950 via-orange-950 to-amber-900', c1: 'from-orange-400 to-rose-400', c2: 'from-violet-600 to-purple-600' },
    ocean: { bg: 'from-slate-950 via-blue-950 to-cyan-900', c1: 'from-cyan-400 to-blue-400', c2: 'from-teal-600 to-emerald-600' },
    forest: { bg: 'from-slate-950 via-green-950 to-lime-900', c1: 'from-lime-400 to-green-400', c2: 'from-yellow-600 to-amber-600' },
    cosmic: { bg: 'from-violet-950 via-purple-950 to-indigo-900', c1: 'from-violet-400 to-purple-400', c2: 'from-rose-600 to-pink-600' },
    matrix: { bg: 'from-black via-gray-950 to-green-950', c1: 'from-green-400 to-lime-400', c2: 'from-emerald-600 to-teal-600' },
    sakura: { bg: 'from-pink-950 via-rose-950 to-purple-900', c1: 'from-pink-400 to-rose-400', c2: 'from-purple-600 to-violet-600' }
  };

  const p = previews[theme];

  return (
    <button
      onClick={() => {
        onClick(theme);
        onClose();
      }}
      className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${
        current === theme 
          ? 'border-white shadow-lg shadow-white/20' 
          : 'border-white/10 hover:border-white/30'
      }`}
    >
      <div className={`w-full h-24 rounded-lg bg-gradient-to-br ${p.bg} mb-3`}></div>
      <div className="flex gap-2 mb-3">
        <div className={`flex-1 h-3 rounded bg-gradient-to-r ${p.c1}`}></div>
        <div className={`flex-1 h-3 rounded bg-gradient-to-r ${p.c2}`}></div>
      </div>
      <p className="text-sm font-semibold">{name}</p>
    </button>
  );
}