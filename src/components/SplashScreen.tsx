import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const steps = [
    "Bienvenido a ARCANA",
    "Cargando Agenda Ministerial",
    "Preparando Repertorio Musical", 
    "Conectando Integrantes",
    "Activando Comunicaciones",
    "Sistema Listo"
  ];

  const playWelcomeAudio = useCallback(async () => {
    try {
      // Usar Web Speech API como alternativa más simple
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(
          "¡Bienvenido a ARCANA! El sistema integral para el Ministerio ADN Arca de Noé está preparando todos los servicios para ti."
        );
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.7;
        
        // Buscar una voz en español
        const voices = speechSynthesis.getVoices();
        const spanishVoice = voices.find(voice => voice.lang.includes('es'));
        if (spanishVoice) {
          utterance.voice = spanishVoice;
        }
        
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.log('Audio no disponible:', error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      playWelcomeAudio();
    }, 500);

    return () => clearTimeout(timer);
  }, [playWelcomeAudio]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 500);
          }, 1000);
          return prev;
        }
        return prev + 1;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [onComplete, steps.length]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-blue-600 via-blue-500 to-blue-400 flex flex-col items-center justify-center animate-fade-in">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="w-full h-full bg-white/5" style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }}></div>
      </div>
      
      <div className="relative z-10 text-center">
        {/* Logo with Pulse Animation */}
        <div className="mb-12 animate-scale-in">
          <div className="relative">
            <img 
              src="/lovable-uploads/8fdbb3a5-23bc-40fb-aa20-6cfe73adc882.png" 
              alt="ARCANA Logo" 
              className="w-32 h-32 mx-auto object-cover rounded-3xl shadow-2xl border-4 border-white/30 animate-pulse"
            />
            <div className="absolute inset-0 rounded-3xl bg-white/20 animate-ping"></div>
          </div>
        </div>

        {/* Main Title */}
        <div className="mb-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 animate-scale-in">
            ARCANA
          </h1>
          <p className="text-blue-100 text-xl animate-fade-in" style={{ animationDelay: '0.6s' }}>
            Ministerio ADN Arca de Noé
          </p>
        </div>

        {/* Loading Steps */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-md mx-auto border border-white/20 animate-scale-in" style={{ animationDelay: '0.9s' }}>
          <div className="flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 text-white animate-spin mr-3" />
            <span className="text-white font-medium">Inicializando...</span>
          </div>
          
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div 
                key={step}
                className={`flex items-center transition-all duration-500 ${
                  index <= currentStep ? 'opacity-100' : 'opacity-50'
                }`}
              >
                <div className={`w-3 h-3 rounded-full mr-3 transition-all duration-300 ${
                  index === currentStep 
                    ? 'bg-white animate-pulse' 
                    : index < currentStep 
                    ? 'bg-green-300' 
                    : 'bg-white/30'
                }`}></div>
                <span className={`text-sm transition-all duration-300 ${
                  index === currentStep 
                    ? 'text-white font-medium' 
                    : index < currentStep 
                    ? 'text-green-100' 
                    : 'text-blue-100'
                }`}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="bg-white/20 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-white h-full rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                  boxShadow: '0 0 10px rgba(255,255,255,0.5)'
                }}
              ></div>
            </div>
            <p className="text-blue-100 text-xs mt-2 text-center">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% completado
            </p>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-4 h-4 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 right-16 w-6 h-6 bg-white/15 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-40 right-32 w-3 h-3 bg-white/25 rounded-full animate-bounce" style={{ animationDelay: '2s' }}></div>
      </div>
    </div>
  );
};

export default SplashScreen;