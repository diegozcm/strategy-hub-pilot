import React from 'react';
import * as Icons from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ServiceCardProps {
  icon: string;
  title: string;
  description: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ icon, title, description }) => {
  const IconComponent = Icons[icon as keyof typeof Icons] as React.ComponentType<any>;

  return (
    <Card className="bg-cofound-navy border-cofound-navy hover:border-cofound-cyan transition-all duration-300 group">
      <CardHeader>
        <div className="w-16 h-16 rounded-full bg-cofound-lime flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          {IconComponent ? (
            <IconComponent className="h-8 w-8 text-cofound-navy" />
          ) : (
            <Icons.Lightbulb className="h-8 w-8 text-cofound-navy" />
          )}
        </div>
        <CardTitle className="text-cofound-white text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-cofound-white/80 text-base leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
};
