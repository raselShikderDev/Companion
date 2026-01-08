/** biome-ignore-all lint/style/useImportType: > */
import { Response } from "express";

interface authTokens {
  accessToken?: string;
  refreshToken?: string;
}

export const setAuthCookie = async (
  res: Response,
  loggedinInfo: authTokens
) => {
  if (loggedinInfo.accessToken) {
    res.cookie("accessToken", loggedinInfo.accessToken, {
      secure: true,
      httpOnly: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60
    });
  }

  if (loggedinInfo.refreshToken) {
    res.cookie("refreshToken", loggedinInfo.refreshToken, {
      secure: true,
      httpOnly: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 90
    });
  }
};


export const clearAuthCookie = (res: Response, name: string) => {
  res.clearCookie(name, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
};
