import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // 从URL获取邀请码
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: '未提供邀请码' }, { status: 400 });
    }

    // 查找邀请记录
    const invite = await prisma.invite.findUnique({
      where: { code },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: '无效的邀请码' }, { status: 404 });
    }

    // 返回工作区信息
    return NextResponse.json({
      valid: true,
      workspace: {
        id: invite.workspace.id,
        name: invite.workspace.name,
      },
    });
  } catch (error) {
    console.error('验证邀请码时出错:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
} 