import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const userId = session.user.id;
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: '未提供邀请码' }, { status: 400 });
    }

    // 查找邀请记录
    const invite = await prisma.invite.findUnique({
      where: { code },
    });

    if (!invite) {
      return NextResponse.json({ error: '无效的邀请码' }, { status: 404 });
    }

    const { workspaceId } = invite;

    // 检查用户是否已经是工作区成员
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    // 检查用户是否是工作区所有者
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (existingMember || workspace?.userId === userId) {
      return NextResponse.json({ error: '您已经是该工作区的成员' }, { status: 409 });
    }

    // 将用户添加到工作区
    await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId,
        role: 'member',
      },
    });

    return NextResponse.json({
      message: '成功加入工作区',
      workspaceId
    }, { status: 200 });
  } catch (error) {
    console.error('加入工作区时出错:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
} 