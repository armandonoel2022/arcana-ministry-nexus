
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Radio, Users, Mic } from "lucide-react";
import { ChatRooms } from "@/components/communication/ChatRooms";
import { WalkieTalkie } from "@/components/communication/WalkieTalkie";

const Communication = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-arcana-gradient rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Centro de Comunicación</h1>
          <p className="text-gray-600">Mantente conectado con el equipo del ministerio</p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chats Grupales
            </TabsTrigger>
            <TabsTrigger value="walkie" className="flex items-center gap-2">
              <Radio className="w-4 h-4" />
              Walkie-Talkie
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-arcana-blue-600 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Salas de Chat
                </CardTitle>
                <p className="text-gray-600">
                  Comunícate con diferentes grupos del ministerio
                </p>
              </CardHeader>
              <CardContent>
                <ChatRooms />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="walkie">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-arcana-gold-600 flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  Walkie-Talkie
                </CardTitle>
                <p className="text-gray-600">
                  Comunicación instantánea para el equipo de logística
                </p>
                <Badge className="w-fit bg-arcana-gold-gradient text-white">
                  Canal Logística
                </Badge>
              </CardHeader>
              <CardContent>
                <WalkieTalkie />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Communication;
