import React from 'react'
import type { Route } from '../../+types/root';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router';
import i18n from '@/lib/i18n';

export function meta({}: Route.MetaArgs) {
      return [
        { title: "ProjectFlow - Quản lý dự án hiệu quả" },
        { name: "description", content: "Theo dõi tiến độ, quản lý nhóm và tối ưu năng suất làm việc với ProjectFlow." },
      ];
}
    
const Homepage = () => {
  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };
  // changeLanguage('en');
  
  return (
    <div className="h-full w-full flex items-center justify-center gap-4">
      <Link to="/sign-in">
        <Button className="bg-blue-800 text-white" size="lg">Login</Button>
      </Link>
      <Link to="/sign-up" className="ml-4">
        <Button className="bg-blue-800 text-white" size="lg" variant="outline">Register</Button>
      </Link>
    </div>
  ) 
}

export default Homepage