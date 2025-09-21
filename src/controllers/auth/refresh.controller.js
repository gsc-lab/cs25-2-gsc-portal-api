import { refreshTokens } from '../../services/auth.service.js';
import { UnauthenticatedError } from '../../errors/index.js';

const isVeryRefresh = async (req, res) => {
  // access token과 refresh token의 존재 유무를 체크
  if (req.headers['authorization'] || req.cookies.accessToken) {
    // const bearer = req.headers['authorization'].split('Bearer ')[1];
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;
    console.log('accessToken', accessToken);
    console.log('refreshToken', refreshToken);

    if (!accessToken || !refreshToken) {
      throw new UnauthenticatedError(
        '로그인 정보가 유효하지 않습니다. 다시 로그인하세요.',
      );
    }

    const { newAccess, newRf } = await refreshTokens(accessToken, refreshToken);
    res.cookie('refreshToken', newRf, {
      httpOnly: true,
      maxAge: 14 * 24 * 60 * 60,
    });

    res.cookie('accessToken', newAccess, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60,
    });

    return res.status(200).send({ success: true, message: 'refreshed' });
  }
};

export default { isVeryRefresh };
