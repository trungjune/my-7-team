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
      .map(name => name.trim())
      .filter(name => name !== '')
      .map(name => ({ name, skill: 3, position: 'ST' as Position }))
    setParticipants([...participants, ...newParticipants])
    setBulkParticipants('')
  }

  const generateTeams = () => {
    // Nhóm người chơi theo vị trí
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

    // Phân bổ người chơi theo vị trí cho mỗi đội
    POSITIONS.forEach(position => {
      const positionPlayers = playersByPosition[position]
      positionPlayers.forEach((player, index) => {
        const teamIndex = index % numberOfTeams
        newTeams[teamIndex].push(player)
      })
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
        <h1 className='text-3xl font-bold text-center mb-8'>Random Team Generator</h1>

        <div className='grid md:grid-cols-2 gap-8'>
          <Card>
            <CardHeader>
              <CardTitle>Participants</CardTitle>
              <CardDescription>Add and manage participants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4'>
                <div className='flex gap-2'>
                  <Input
                    placeholder='Enter participant name'
                    value={newParticipantName}
                    onChange={e => setNewParticipantName(e.target.value)}
                  />
                  <Select
                    value={newParticipantSkill.toString()}
                    onValueChange={value => setNewParticipantSkill(Number(value))}
                  >
                    <SelectTrigger className='w-[80px]'>
                      <SelectValue placeholder='Skill' />
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
                      <SelectValue placeholder='Position' />
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
                  placeholder='Copy and paste a list of participants. One participant per line.'
                  value={bulkParticipants}
                  onChange={e => setBulkParticipants(e.target.value)}
                />
                <Button onClick={importParticipants}>Import Participants</Button>
                <div className='max-h-[400px] overflow-y-auto'>
                  {participants.map((p, index) => (
                    <div key={index} className='flex items-center gap-2 mb-2'>
                      <Input value={p.name} readOnly className='flex-grow' />
                      <div className='w-[50px] text-center bg-gray-200 rounded-md py-1'>{p.skill}</div>
                      <div className='w-[60px] text-center bg-blue-200 rounded-md py-1'>{p.position}</div>
                      <Button variant='outline' size='icon' onClick={() => removeParticipant(index)}>
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
              <CardDescription>Generate and manage teams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4'>
                <div className='flex items-center gap-4'>
                  <Label htmlFor='teams'>Number of Teams</Label>
                  <Select value={numberOfTeams.toString()} onValueChange={value => setNumberOfTeams(Number(value))}>
                    <SelectTrigger className='w-[100px]'>
                      <SelectValue placeholder='Teams' />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={generateTeams}>Generate Teams</Button>
                </div>
                {teams.length > 0 && (
                  <>
                    <div className='max-h-[400px] overflow-y-auto'>
                      <div className='grid grid-cols-2 gap-4'>
                        {teams.map((team, index) => {
                          const positionStats = calculatePositionStats(team)
                          return (
                            <div key={index} className='border p-4 rounded-lg'>
                              <h3 className='font-bold mb-2'>
                                Team {index + 1} (Total: {team.reduce((sum, p) => sum + p.skill, 0)})
                              </h3>
                              {POSITIONS.map(pos => (
                                <div key={pos} className='mb-2'>
                                  <h4 className='font-semibold text-sm text-gray-600'>
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
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <Switch checked={hideSkillLevels} onCheckedChange={setHideSkillLevels} id='hide-skills' />
                        <Label htmlFor='hide-skills'>Hide skill levels</Label>
                      </div>
                      <Button variant='outline' onClick={relaunch}>
                        <RefreshCw className='h-4 w-4 mr-2' /> Relaunch
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
