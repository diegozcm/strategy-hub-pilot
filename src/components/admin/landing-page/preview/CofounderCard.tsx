import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Linkedin } from 'lucide-react';

interface CofounderCardProps {
  name: string;
  role: string;
  company: string;
  photo: string;
  linkedin: string;
}

export const CofounderCard: React.FC<CofounderCardProps> = ({
  name,
  role,
  company,
  photo,
  linkedin
}) => {
  return (
    <Card className="bg-cofound-white border-none shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6 text-center">
        <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-cofound-cyan">
          {photo ? (
            <img 
              src={photo} 
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-cofound-light-gray flex items-center justify-center">
              <span className="text-3xl font-bold text-cofound-navy">
                {name.charAt(0)}
              </span>
            </div>
          )}
        </div>
        
        <h3 className="text-xl font-bold text-cofound-navy mb-2">{name}</h3>
        <p className="text-sm text-gray-600 mb-1">{role}</p>
        <p className="text-xs text-gray-500 mb-4">{company}</p>
        
        {linkedin && (
          <Button
            variant="outline"
            size="sm"
            className="border-cofound-cyan text-cofound-cyan hover:bg-cofound-cyan hover:text-cofound-white"
            onClick={() => window.open(linkedin, '_blank')}
          >
            <Linkedin className="h-4 w-4 mr-2" />
            LinkedIn
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
