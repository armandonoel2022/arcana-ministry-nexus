import { useState, useRef, useCallback, useEffect } from 'react'

interface VoiceAnalysisData {
  pitch: number
  volume: number
  isRecording: boolean
  targetPitch?: number
}

export const useVoiceAnalysis = () => {
  const [analysisData, setAnalysisData] = useState<VoiceAnalysisData>({
    pitch: 0,
    volume: 0,
    isRecording: false
  })
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const initializeAudioContext = useCallback(async () => {
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      streamRef.current = stream
      
      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      const audioContext = audioContextRef.current
      
      // Create analyser node
      analyserRef.current = audioContext.createAnalyser()
      analyserRef.current.fftSize = 2048
      analyserRef.current.smoothingTimeConstant = 0.8
      
      // Connect microphone to analyser
      microphoneRef.current = audioContext.createMediaStreamSource(stream)
      microphoneRef.current.connect(analyserRef.current)
      
      return true
    } catch (error) {
      console.error('Error initializing audio context:', error)
      return false
    }
  }, [])

  const getPitch = useCallback((dataArray: Uint8Array, sampleRate: number) => {
    // Convert to float array
    const floatArray = new Float32Array(dataArray.length)
    for (let i = 0; i < dataArray.length; i++) {
      floatArray[i] = (dataArray[i] - 128) / 128
    }
    
    // Autocorrelation for pitch detection
    const correlations = new Array(floatArray.length).fill(0)
    
    for (let lag = 0; lag < floatArray.length; lag++) {
      let correlation = 0
      for (let i = 0; i < floatArray.length - lag; i++) {
        correlation += floatArray[i] * floatArray[i + lag]
      }
      correlations[lag] = correlation
    }
    
    // Find the peak (excluding the first peak at lag 0)
    let maxCorrelation = 0
    let bestLag = 0
    
    for (let lag = 20; lag < correlations.length / 2; lag++) {
      if (correlations[lag] > maxCorrelation) {
        maxCorrelation = correlations[lag]
        bestLag = lag
      }
    }
    
    return bestLag > 0 ? sampleRate / bestLag : 0
  }, [])

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return
    
    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const timeDataArray = new Uint8Array(bufferLength)
    
    analyserRef.current.getByteFrequencyData(dataArray)
    analyserRef.current.getByteTimeDomainData(timeDataArray)
    
    // Calculate volume (RMS)
    let sum = 0
    for (let i = 0; i < timeDataArray.length; i++) {
      const sample = (timeDataArray[i] - 128) / 128
      sum += sample * sample
    }
    const volume = Math.sqrt(sum / timeDataArray.length) * 100
    
    // Calculate pitch
    const sampleRate = audioContextRef.current?.sampleRate || 44100
    const pitch = getPitch(timeDataArray, sampleRate)
    
    setAnalysisData(prev => ({
      ...prev,
      pitch: Math.round(pitch),
      volume: Math.round(volume)
    }))
    
    animationFrameRef.current = requestAnimationFrame(analyzeAudio)
  }, [getPitch])

  const startRecording = useCallback(async (targetPitch?: number) => {
    const success = await initializeAudioContext()
    if (!success) return false
    
    setAnalysisData(prev => ({
      ...prev,
      isRecording: true,
      targetPitch
    }))
    
    analyzeAudio()
    return true
  }, [initializeAudioContext, analyzeAudio])

  const stopRecording = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    
    setAnalysisData(prev => ({
      ...prev,
      isRecording: false,
      pitch: 0,
      volume: 0
    }))
  }, [])

  useEffect(() => {
    return () => {
      stopRecording()
    }
  }, [stopRecording])

  const getPitchNote = useCallback((frequency: number) => {
    if (frequency < 80) return ''
    
    const A4 = 440
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    
    const semitone = 12 * Math.log2(frequency / A4)
    const note = Math.round(semitone) % 12
    const octave = Math.floor((semitone + 57) / 12)
    
    return `${noteNames[note < 0 ? note + 12 : note]}${octave}`
  }, [])

  return {
    analysisData,
    startRecording,
    stopRecording,
    getPitchNote
  }
}