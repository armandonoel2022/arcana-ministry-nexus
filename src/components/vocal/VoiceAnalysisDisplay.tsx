import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface VoiceAnalysisDisplayProps {
  pitch: number
  volume: number
  targetPitch?: number
  pitchNote: string
  isRecording: boolean
}

export const VoiceAnalysisDisplay = ({ 
  pitch, 
  volume, 
  targetPitch, 
  pitchNote, 
  isRecording 
}: VoiceAnalysisDisplayProps) => {
  const getPitchAccuracy = () => {
    if (!targetPitch || pitch === 0) return 0
    const difference = Math.abs(pitch - targetPitch)
    const accuracy = Math.max(0, 100 - (difference / targetPitch) * 100)
    return Math.round(accuracy)
  }

  const getVolumeLevel = () => {
    if (volume < 10) return 'Muy bajo'
    if (volume < 30) return 'Bajo'
    if (volume < 60) return 'Bueno'
    if (volume < 80) return 'Alto'
    return 'Muy alto'
  }

  const getVolumeColor = () => {
    if (volume < 10) return 'destructive'
    if (volume < 30) return 'secondary'
    if (volume < 80) return 'default'
    return 'destructive'
  }

  const accuracy = getPitchAccuracy()

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Pitch Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Análisis de Tono</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {isRecording ? (pitch > 0 ? `${pitch} Hz` : '--') : '--'}
            </div>
            <div className="text-sm text-muted-foreground">
              {isRecording ? pitchNote || 'Detectando...' : 'Sin detectar'}
            </div>
          </div>
          
          {targetPitch && isRecording && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Precisión</span>
                <span>{accuracy}%</span>
              </div>
              <Progress 
                value={accuracy} 
                className="h-2"
              />
              <div className="text-xs text-center text-muted-foreground">
                Objetivo: {targetPitch} Hz
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Volume Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Volumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {isRecording ? `${Math.round(volume)}%` : '--'}
            </div>
            <Badge variant={getVolumeColor()} className="mt-1">
              {isRecording ? getVolumeLevel() : 'Sin detectar'}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <Progress 
              value={Math.min(volume, 100)} 
              className="h-2"
            />
            <div className="text-xs text-center text-muted-foreground">
              Nivel de intensidad vocal
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Feedback */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Retroalimentación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {!isRecording ? (
              <div className="text-center text-muted-foreground">
                <div className="text-sm">Presiona iniciar para comenzar el análisis en tiempo real</div>
              </div>
            ) : (
              <div className="space-y-2">
                {pitch === 0 && (
                  <Badge variant="secondary" className="w-full justify-center">
                    Habla más fuerte
                  </Badge>
                )}
                
                {volume < 10 && pitch > 0 && (
                  <Badge variant="destructive" className="w-full justify-center">
                    Volumen muy bajo
                  </Badge>
                )}
                
                {volume > 80 && (
                  <Badge variant="destructive" className="w-full justify-center">
                    Volumen muy alto
                  </Badge>
                )}
                
                {targetPitch && accuracy > 80 && (
                  <Badge variant="default" className="w-full justify-center">
                    ¡Excelente precisión!
                  </Badge>
                )}
                
                {volume >= 10 && volume <= 80 && (!targetPitch || accuracy > 60) && (
                  <Badge variant="default" className="w-full justify-center">
                    ¡Muy bien!
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}