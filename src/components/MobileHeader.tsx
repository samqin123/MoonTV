'use client';

import Image from 'next/image';
import Link from 'next/link';

import { BackButton } from './BackButton';
import { useSite } from './SiteProvider';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

interface MobileHeaderProps {
  showBackButton?: boolean;
}

const MobileHeader = ({ showBackButton = false }: MobileHeaderProps) => {
  const { siteName } = useSite();
  return (
    <header className='md:hidden relative w-full bg-white/80 dark:bg-[#0d0d12]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-neon/20 shadow-sm'>
      <div className='h-12 flex items-center justify-between px-4'>
        {/* 左侧：返回按钮和设置按钮 */}
        <div className='flex items-center gap-2'>
          {showBackButton && <BackButton />}
        </div>

        {/* 右侧按钮 */}
        <div className='flex items-center gap-2'>
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      {/* 中间：Logo（绝对居中） */}
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
        <Link
          href='/'
          className='flex items-center text-lg font-bold text-neon font-heading tracking-widest hover:opacity-80 transition-opacity'
        >
          <Image
            src='/icons/icon-256x256.png'
            alt={siteName}
            width={44}
            height={44}
            className='h-11 w-11 rounded-md mr-2'
          />
          {siteName}
        </Link>
      </div>
    </header>
  );
};

export default MobileHeader;
