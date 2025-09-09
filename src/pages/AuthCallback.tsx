import React, { useEffect, useState } from 'react';
import type { ProfileInsert } from '../types/TodoType';
import { createProfile } from '../lib/profile';
import { supabase } from '../lib/supabase';

/**
 * - 인증 콜백 URL 처리
 * - 사용자에게 인증 진행 상태 안내
 * - 자동 인증 처리 완료 안내
 */
function AuthCallback() {
  const [msg, setMsg] = useState<string>('인증 처리 중 ...');
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setMsg('🥰 이메일 인증 완료. 홈으로 이동하세요. ^^');
  //   }, 1500);

  //   // 클린업 함수
  //   return () => {
  //     clearTimeout(timer);
  //   };
  // }, []);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URL에서 세션 정보 가져오기
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          setMsg(`인증 오류: ${error.message}`);
          return;
        }

        if (data.session?.user) {
          const user = data.session.user;
          const nickname = user.user_metadata?.nickname;

          // 프로필이 이미 존재하는지 확인
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

          if (!existingProfile && nickname) {
            // 프로필이 없고 닉네임이 있으면 프로필 생성
            const newProfile: ProfileInsert = {
              id: user.id,
              nickname: nickname,
            };

            const profileResult = await createProfile(newProfile);
            if (profileResult) {
              setMsg('🥰 이메일 인증 및 프로필 생성 완료! 홈으로 이동하세요. ^^');
            } else {
              setMsg('🥰 이메일 인증 완료! (프로필 생성 실패 - 나중에 수동으로 생성 가능)');
            }
          } else {
            setMsg('🥰 이메일 인증 완료! 홈으로 이동하세요. ^^');
          }
        } else {
          setMsg('인증 정보를 찾을 수 없습니다.');
        }
      } catch (error) {
        console.error('인증 콜백 처리 오류:', error);
        setMsg('인증 처리 중 오류가 발생했습니다.');
      }
    };

    // 약간의 지연 후 처리 (Supabase 세션 초기화 대기)
    const timer = setTimeout(handleAuthCallback, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div>
      <h2>인증 페이지</h2>
      <div>{msg}</div>
    </div>
  );
}

export default AuthCallback;
