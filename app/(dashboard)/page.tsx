'use client'

import { SetStateAction, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Trash2, Plus } from 'lucide-react'

type Position = 'ST' | 'CAM' | 'CB' | 'LM' | 'RM' | 'GK'

type Participant = {
  name: string
  skill: number
  position: Position
}

type Team = Participant[]

const POSITIONS: Position[] = ['ST', 'CAM', 'CB', 'LM', 'RM', 'GK']

const POSITION_LABELS: Record<Position, string> = {
  ST: 'Tiền đạo',
  CAM: 'Tiền vệ',
  CB: 'Hậu vệ',
  LM: 'Cánh trái',
  RM: 'Cánh phải',
  GK: 'Thủ môn'
}

export default function TeamGenerator() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [numberOfTeams, setNumberOfTeams] = useState(2)
  const [hideSkillLevels, setHideSkillLevels] = useState(false)
  const [newParticipantName, setNewParticipantName] = useState('')
  const [newParticipantSkill, setNewParticipantSkill] = useState(3)
  const [newParticipantPosition, setNewParticipantPosition] = useState<Position>('ST')
  const [bulkParticipants, setBulkParticipants] = useState('')

  const addParticipant = () => {
    if (newParticipantName) {
      setParticipants([
        ...participants,
        {
          name: newParticipantName,
          skill: newParticipantSkill,
          position: newParticipantPosition
        }
      ])
      setNewParticipantName('')
      setNewParticipantSkill(3)
    }
  }

  const removeParticipant = (index: number) => {
    const updatedParticipants = participants.filter((_, i) => i !== index)
    setParticipants(updatedParticipants)
  }

  const importParticipants = () => {
    const newParticipants = bulkParticipants
      .split('\n')
      .map(line => {
        const [name, skill, position] = line.trim().split(' ')
        return {
          name,
          skill: Number(skill),
          position: position as Position
        }
      })
      .filter(p => p.name !== '')
    setParticipants([...participants, ...newParticipants])
    setBulkParticipants('')
  }

  const generateTeams = () => {
    const playersByPosition = POSITIONS.reduce((acc, pos) => {
      acc[pos] = participants.filter(p => p.position === pos)
      return acc
    }, {} as Record<Position, Participant[]>)

    // Trộn ngẫu nhiên người chơi trong mỗi vị trí
    Object.keys(playersByPosition).forEach(pos => {
      playersByPosition[pos as Position].sort(() => 0.5 - Math.random())
    })

    // Khởi tạo các đội trống
    const newTeams: Team[] = Array.from({ length: numberOfTeams }, () => [])

    // Phân bổ ít nhất một người cho mỗi vị trí vào mỗi đội
    POSITIONS.forEach(position => {
      const positionPlayers = playersByPosition[position]
      const numTeams = newTeams.length

      for (let i = 0; i < numTeams; i++) {
        if (positionPlayers.length > 0) {
          newTeams[i].push(positionPlayers.pop()!) // Thêm 1 người vào đội i
        }
      }
    })

    // Phân bổ phần còn lại cho các đội theo điểm
    const remainingPlayers = participants.filter(p => !newTeams.flat().includes(p))
    remainingPlayers.forEach(player => {
      const teamIndex = newTeams.reduce((minIndex, team, i) => {
        const teamScore = team.reduce((sum, p) => sum + p.skill, 0)
        const minScore = newTeams[minIndex].reduce((sum, p) => sum + p.skill, 0)
        return teamScore < minScore ? i : minIndex
      }, 0)
      newTeams[teamIndex].push(player)
    })

    setTeams(newTeams)
  }

  const relaunch = () => {
    generateTeams()
  }

  // Tính tổng điểm kỹ năng cho mỗi vị trí trong đội
  const calculatePositionStats = (team: Team) => {
    return POSITIONS.reduce((acc, pos) => {
      const positionPlayers = team.filter(p => p.position === pos)
      acc[pos] = {
        count: positionPlayers.length,
        totalSkill: positionPlayers.reduce((sum, p) => sum + p.skill, 0)
      }
      return acc
    }, {} as Record<Position, { count: number; totalSkill: number }>)
  }

  return (
    <div className='min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-7xl mx-auto'>
        <h1 className='text-3xl font-bold text-center mb-8'>Ứng dụng Chia Đội Ngẫu Nhiên</h1>

        <Card>
          <CardHeader>
            <CardTitle>Người Tham Gia</CardTitle>
            <CardDescription>Thêm và quản lý người tham gia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4'>
              <div className='flex gap-2'>
                <Input
                  placeholder='Nhập tên người tham gia'
                  value={newParticipantName}
                  onChange={e => setNewParticipantName(e.target.value)}
                />
                <Select
                  value={newParticipantSkill.toString()}
                  onValueChange={value => setNewParticipantSkill(Number(value))}
                >
                  <SelectTrigger className='w-[80px]'>
                    <SelectValue placeholder='Kỹ năng' />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(skill => (
                      <SelectItem key={skill} value={skill.toString()}>
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={newParticipantPosition}
                  onValueChange={(value: Position) => setNewParticipantPosition(value)}
                >
                  <SelectTrigger className='w-[120px]'>
                    <SelectValue placeholder='Vị trí' />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map(pos => (
                      <SelectItem key={pos} value={pos}>
                        {POSITION_LABELS[pos]} ({pos})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addParticipant}>
                  <Plus className='h-4 w-4' />
                </Button>
              </div>
              <Textarea
                placeholder='Dán danh sách người tham gia. Mỗi người một dòng theo định dạng: Tên Kỹ năng Vị trí,
                    ví dụ: TrungTH 3 ST'
                value={bulkParticipants}
                onChange={e => setBulkParticipants(e.target.value)}
              />
              <Button onClick={importParticipants}>Nhập Danh Sách</Button>
              <div className='max-h-[400px] overflow-y-auto'>
                {participants.map((p, index) => (
                  <div key={index} className='flex items-center gap-2 mb-2'>
                    <Input
                      value={p.name}
                      onChange={e => {
                        const updatedParticipants = [...participants]
                        updatedParticipants[index].name = e.target.value
                        setParticipants(updatedParticipants)
                      }}
                      className='flex-grow'
                    />
                    <Select
                      value={p.skill.toString()}
                      onValueChange={value => {
                        const updatedParticipants = [...participants]
                        updatedParticipants[index].skill = Number(value)
                        setParticipants(updatedParticipants)
                      }}
                    >
                      <SelectTrigger className='w-[80px]'>
                        <SelectValue placeholder='Kỹ năng' />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map(skill => (
                          <SelectItem key={skill} value={skill.toString()}>
                            {skill}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={p.position}
                      onValueChange={(value: Position) => {
                        const updatedParticipants = [...participants]
                        updatedParticipants[index].position = value
                        setParticipants(updatedParticipants)
                      }}
                    >
                      <SelectTrigger className='w-[120px]'>
                        <SelectValue placeholder='Vị trí' />
                      </SelectTrigger>
                      <SelectContent>
                        {POSITIONS.map(pos => (
                          <SelectItem key={pos} value={pos}>
                            {POSITION_LABELS[pos]} ({pos})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant='outline' size='icon' onClick={() => removeParticipant(index)}>
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <div className='mt-8'>
          <Card>
            <CardHeader>
              <CardTitle>Đội</CardTitle>
              <CardDescription>Tạo và quản lý đội</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4'>
                <div className='flex items-center gap-4'>
                  <Label htmlFor='teams'>Số Lượng Đội</Label>
                  <Select value={numberOfTeams.toString()} onValueChange={value => setNumberOfTeams(Number(value))}>
                    <SelectTrigger className='w-[100px]'>
                      <SelectValue placeholder='Đội' />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={generateTeams}>Tạo Đội</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {teams.length > 0 && (
          <div className='mt-8'>
            <h2 className='text-2xl font-bold mb-4'>Kết Quả Chia Đội</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {teams.map((team, index) => {
                return (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>Đội {index + 1}</CardTitle>
                      <CardDescription>Tổng điểm: {team.reduce((sum, p) => sum + p.skill, 0)}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {POSITIONS.map(pos => (
                        <div key={pos} className='mb-4'>
                          <h4 className='font-semibold text-sm text-gray-600 mb-2'>
                            {POSITION_LABELS[pos]} ({pos})
                          </h4>
                          <ul className='list-disc pl-5'>
                            {team
                              .filter(member => member.position === pos)
                              .map((member, memberIndex) => (
                                <li key={memberIndex} className='mb-1'>
                                  {member.name}
                                  {!hideSkillLevels && (
                                    <span className='text-orange-500 font-bold ml-2'>({member.skill})</span>
                                  )}
                                </li>
                              ))}
                          </ul>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )
              })}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Switch checked={hideSkillLevels} onCheckedChange={setHideSkillLevels} id='hide-skills' />
                  <Label htmlFor='hide-skills'>Ẩn mức kỹ năng</Label>
                </div>
                <Button variant='outline' onClick={relaunch}>
                  <RefreshCw className='h-4 w-4 mr-2' /> Tạo lại
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
