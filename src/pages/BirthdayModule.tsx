import React from 'react';
import BirthdayModule from '@/components/birthday/BirthdayModule';

const BirthdayModulePage = () => {
  return (
    <div className="w-full min-h-screen bg-white fixed left-0 right-0 top-0 bottom-0 overflow-y-auto">
      <div className="w-full px-4 max-w-none sm:max-w-7xl sm:mx-auto sm:px-6 py-4">
        <BirthdayModule />
      </div>
    </div>
  );
};

export default BirthdayModulePage;
